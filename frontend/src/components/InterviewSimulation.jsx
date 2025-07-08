import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import InterviewerAvatar from './InterviewerAvatar';

export default function InterviewSimulation({ onEnd }) {
  const [transcript, setTranscript] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [gesture, setGesture] = useState(null);
  const audioRef = useRef(null);

  const handleAudioPlayback = useCallback(async (audioData) => {
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const audio = new Audio(URL.createObjectURL(blob));
    audioRef.current = audio;
    audio.onplay = () => setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  }, []);

  const handleWsMessage = useCallback(async (evt) => {
    if (typeof evt.data === 'string') {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (msg.type === 'text') {
        setTranscript((t) => [...t, msg.data]);
        if (msg.emotion) setEmotion(msg.emotion);
        if (msg.gesture) setGesture(msg.gesture);
      }
    } else {
      await handleAudioPlayback(evt.data);
    }
  }, [handleAudioPlayback]);

  useEffect(() => {
    const socket = window.ws;
    if (!socket) return;
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('message', handleWsMessage);
    return () => socket.removeEventListener('message', handleWsMessage);
  }, [handleWsMessage]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-gray-800">
          <Canvas className="w-full h-full" camera={{ position: [0, 1.6, 3] }}>
            <ambientLight intensity={0.5} />
            <directionalLight intensity={1} position={[0, 5, 5]} />
            <Suspense fallback={null}>
              <InterviewerAvatar speaking={speaking} emotion={emotion} gesture={gesture} />
            </Suspense>
          </Canvas>
        </div>
        <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto hidden md:block">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <div id="transcript" className="space-y-1 text-sm">
            {transcript.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-800 flex justify-center">
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          onClick={onEnd}
        >
          End Call
        </button>
      </div>
    </div>
  );
}
