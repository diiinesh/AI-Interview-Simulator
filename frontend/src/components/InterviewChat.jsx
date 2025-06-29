import React, { useEffect, useRef, useState, useCallback } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

function InterviewChat({ onBack, socket }) {
    const [message, setMessage] = useState('');
    const [tts, setTts] = useState(false);
    const [log, setLog] = useState([]);
    const [wsStatus, setWsStatus] = useState('connecting');
    const [audioEnabled, setAudioEnabled] = useState(true); // Control audio playback separately
    const logRef = useRef(null);
    const socketRef = useRef(null);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [isRecording, setIsRecording] = useState(false);
    const recorder = useRef(new MicRecorder({ bitRate: 128 }));


    const addLog = useCallback((html) => {
        setLog(prev => [...prev, html]);
        setTimeout(() => {
            if (logRef.current) {
                logRef.current.scrollTop = logRef.current.scrollHeight;
            }
        }, 0);
    }, []);

    const handleAudioPlayback = useCallback(async (audioData) => {
        // Only play audio if TTS is enabled and audio is enabled
        if (!tts || !audioEnabled) {
            console.log('Audio playback skipped - TTS or audio disabled');
            return;
        }

        try {
            const blob = new Blob([audioData], { type: 'audio/mpeg' });
            const audio = new Audio(URL.createObjectURL(blob));

            audio.onloadeddata = () => {
                console.log('Audio loaded, playing...');
            };

            audio.onerror = (err) => {
                console.error('Audio playback error:', err);
                addLog('<span style="color: orange;">⚠️ Audio playback failed</span>');
            };

            await audio.play();
            console.log('Audio played successfully');
        } catch (err) {
            console.warn('Audio play failed:', err);
            addLog('<span style="color: orange;">⚠️ Audio autoplay blocked by browser</span>');
        }
    }, [tts, audioEnabled, addLog]);

    const handleWebSocketMessage = useCallback(async (evt) => {
        if (typeof evt.data === 'string') {
            let msg;
            try {
                msg = JSON.parse(evt.data);
            } catch {
                console.warn('Failed to parse WebSocket message');
                return;
            }

            switch (msg.type) {
                case 'text':
                    addLog(`<span class="bot"></span> ${msg.data}`);
                    break;
                case 'error':
                    addLog(`<span class="bot" style="color: red;">Error:</span> ${msg.data}`);
                    break;
                case 'tts_status':
                    addLog(`<span style="color: blue;">🔊 TTS: ${msg.data}</span>`);
                    break;
                default:
                    console.log('Unknown message type:', msg.type);
            }
        } else {
            // Handle binary audio data
            console.log('Received audio data, TTS enabled:', tts);
            await handleAudioPlayback(evt.data);
        }
    }, [addLog, handleAudioPlayback, tts]);

    const handleStartSpeaking = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        addLog('<span style="color: gray;">🎙️ Listening...</span>');

        try {
            recognition.start();
        } catch (err) {
            console.warn("Recognition start error:", err.message);
            addLog(`<span style="color: orange;">⚠️ Mic already active. Please wait.</span>`);
            return;
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            addLog(`<span class="me">Me (spoken):</span> ${transcript}`);

            const payload = {
                type: 'user_message',
                text: transcript,
                tts: tts
            };

            socketRef.current?.send(JSON.stringify(payload));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            addLog(`<span style="color: red;">⚠️ STT error: ${event.error}</span>`);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            addLog('<span style="color: gray;">🎤 Mic off</span>');
        };
    }, [tts, addLog]);

    const handleStartRecording = async () => {
        try {
            await recorder.current.start();
            setIsRecording(true);
            addLog('<span style="color: gray;">🎙️ Recording started (MP3)...</span>');
        } catch (e) {
            console.error('Failed to start recorder:', e);
            addLog('<span style="color: red;">❌ Mic access error</span>');
        }
    };


    const handleStopRecording = async () => {
        try {
            const [buffer, blob] = await recorder.current.stop().getMp3();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];

                socketRef.current?.send(JSON.stringify({
                    type: 'user_audio',
                    audio: base64Audio,
                    tts: tts,
                }));

                addLog('<span style="color: gray;">🎧 MP3 audio sent for transcription...</span>');
            };

            reader.readAsDataURL(blob);
            setIsRecording(false);
        } catch (e) {
            console.error('Failed to stop recorder:', e);
            addLog('<span style="color: red;">❌ Recording failed</span>');
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        console.log('Using existing WebSocket');
        socketRef.current = socket;

        socket.binaryType = 'arraybuffer';
        socket.onopen = () => {
            console.log('WebSocket connected');
            addLog('<em style="color: green;">✅ Connected to server</em>');
            setWsStatus('open');
        };

        socket.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            addLog('<em style="color: red;">❌ Disconnected from server</em>');
            setWsStatus('closed');
        };

        socket.onerror = (e) => {
            console.error('WebSocket error:', e);
            addLog('<span class="bot" style="color: red;">Error:</span> Connection failed');
            setWsStatus('error');
        };

        socket.onmessage = handleWebSocketMessage;

        return () => {
            socket.onopen = null;
            socket.onclose = null;
            socket.onerror = null;
            socket.onmessage = null;
        };
    }, [socket, addLog, handleWebSocketMessage]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addLog('<span style="color: red;">❌ Speech recognition not supported in this browser</span>');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.lang = 'de-DE'; // Set to 'en-US' for English interviews

        recognitionRef.current = recognition;
    }, [addLog]);

    const handleSend = useCallback(() => {
        if (!message.trim()) return;

        if (wsStatus !== 'open') {
            addLog('<span style="color: red;">❌ Cannot send - not connected to server</span>');
            return;
        }

        addLog(`<span class="me">Me:</span> ${message}`);

        const payload = {
            type: 'user_message',
            text: message,
            tts: tts // This tells the backend whether to generate audio
        };

        console.log('Sending message with TTS:', tts);
        socketRef.current?.send(JSON.stringify(payload));
        setMessage('');
    }, [message, tts, wsStatus, addLog]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const getStatusIndicator = () => {
        const colors = {
            connecting: 'orange',
            open: 'green',
            closed: 'red',
            error: 'red'
        };

        const labels = {
            connecting: 'Connecting...',
            open: 'Connected',
            closed: 'Disconnected',
            error: 'Error'
        };

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
                fontSize: '0.9em'
            }}>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: colors[wsStatus]
                }}></div>
                <span>Status: {labels[wsStatus]}</span>
                {tts && (
                    <>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span style={{ color: 'blue' }}>🔊 Voice enabled</span>
                    </>
                )}
            </div>
        );
    };

    return (
        <div>
            <div style={{ marginBottom: 10 }}>
                <button onClick={onBack} style={{ padding: '6px 12px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
                    ← Back
                </button>
            </div>
            {getStatusIndicator()}

            <div
                id="log"
                ref={logRef}
                style={{
                    height: 400,
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    padding: 8,
                    backgroundColor: '#fafafa',
                    borderRadius: 4
                }}
            >
                {log.map((line, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <input
                    id="msg"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={wsStatus === 'open' ? "Type your message..." : "Waiting for connection..."}
                    onKeyDown={handleKeyDown}
                    disabled={wsStatus !== 'open'}
                    style={{
                        flex: 1,
                        padding: 8,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        fontSize: '14px'
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={wsStatus !== 'open' || !message.trim()}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: (wsStatus !== 'open' || !message.trim()) ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: (wsStatus !== 'open' || !message.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Send
                </button>

                {!isRecording ? (
                    <button
                        onClick={handleStartRecording}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🎤 Start Recording
                    </button>
                ) : (
                    <button
                        onClick={handleStopRecording}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🛑 Stop Recording
                    </button>
                )}


                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    border: tts ? '2px solid #007bff' : '1px solid #ccc',
                    borderRadius: 4,
                    backgroundColor: tts ? '#e7f3ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}>
                    <input
                        type="checkbox"
                        checked={tts}
                        onChange={e => {
                            const newTtsValue = e.target.checked;
                            setTts(newTtsValue);
                            console.log('TTS toggled:', newTtsValue);
                            addLog(`<span style="color: blue;">🔊 Voice ${newTtsValue ? 'enabled' : 'disabled'}</span>`);
                        }}
                        style={{ marginRight: 4 }}
                    />
                    🔊 Enable voice
                </label>
            </div>

            {/* Audio control (optional) */}
            <div style={{ marginTop: 8, fontSize: '0.8em', color: '#666' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                        type="checkbox"
                        checked={audioEnabled}
                        onChange={e => setAudioEnabled(e.target.checked)}
                    />
                    Allow audio playback (if blocked by browser)
                </label>
            </div>
        </div>
    );
}

export default InterviewChat;