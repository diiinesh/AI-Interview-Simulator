import React, { useEffect, useRef, useState } from 'react';

function InterviewChat() {
  const [message, setMessage] = useState('');
  const [tts, setTts] = useState(false);
  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');
    socket.binaryType = 'arraybuffer';

    window.ws = socket;

    socket.onopen = () => addLog('<em>Debug: socket open</em>');
    socket.onclose = () => addLog('<em>Debug: socket closed</em>');
    socket.onerror = e => addLog(`<span class="bot">Error:</span> ${e.message}`);

    socket.onmessage = async evt => {
      if (typeof evt.data === 'string') {
        let msg;
        try {
          msg = JSON.parse(evt.data);
        } catch {
          return;
        }

        if (msg.type === 'text') addLog(`<span class="bot">Interviewer:</span> ${msg.data}`);
        if (msg.type === 'error') addLog(`<span class="bot">Error:</span> ${msg.data}`);
      } else {
        const blob = new Blob([evt.data], { type: 'audio/mpeg' });
        const audio = new Audio(URL.createObjectURL(blob));
        try {
          await audio.play();
        } catch (err) {
          console.warn('Audio play failed:', err);
        }
      }
    };

    return () => socket.close();
  }, []);

  const addLog = html => {
    setLog(prev => [...prev, html]);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    addLog(`<span class="me">Me:</span> ${message}`);
    window.ws?.send(JSON.stringify({ type: 'user_message', text: message, tts }));
    setMessage('');
  };

  return (
    <div>
      <div id="log" ref={logRef} style={{ height: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
        {log.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <input
          id="msg"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type and press Enter…"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: 6 }}
        />
        <button onClick={handleSend}>Send</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={tts} onChange={e => setTts(e.target.checked)} />
          Enable voice
        </label>
      </div>
    </div>
  );
}

export default InterviewChat;
