import React, { useState } from 'react';
import JobInput from './components/JobInput';
import InterviewChat from './components/InterviewChat';
import InterviewSimulation from './components/InterviewSimulation';
import './styles/App.css';

function App() {
  const [interactionMode, setInteractionMode] = useState(null);

  return (
    <div className="App">
      {!interactionMode && <JobInput onInteractionModeSelect={setInteractionMode} />}
      {interactionMode === "chat" && <InterviewChat />}
      {interactionMode === "simulation" && <InterviewSimulation />}
    </div>
  );
}

export default App;
