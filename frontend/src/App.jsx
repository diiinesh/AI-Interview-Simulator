import React, { useState, useEffect } from 'react';
import JobInput from './components/JobInput';
import InterviewChat from './components/InterviewChat';
import LegacyInterviewSimulation from './components/LegacyInterviewSimulation';
import InterviewSimulation from './components/InterviewSimulation';
import './styles/App.css';

function App() {
  const [interactionMode, setInteractionMode] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.binaryType = 'arraybuffer';
    setSocket(ws);
    window.ws = ws;

    return () => {
      ws.close();
      window.ws = null;
    };
  }, []);

  return (
    <div className="App">
      {!interactionMode && (
        <JobInput onInteractionModeSelect={setInteractionMode} socket={socket} />
      )}
      {interactionMode === "chat" && (
        <InterviewChat
          onBack={() => setInteractionMode(null)}
          socket={socket}
        />
      )}
      {interactionMode === "simulation" && (
        <LegacyInterviewSimulation
          onBack={() => setInteractionMode(null)}
          socket={socket}
        />
      )}
      {interactionMode === "interviewSimulation" && (
        <InterviewSimulation
          onEnd={() => setInteractionMode(null)}
        />
      )}
    </div>
  );
}

export default App;
