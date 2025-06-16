import React from 'react';
import InterviewChat from './components/InterviewChat';
import JobInput from './components/JobInput';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <h2>AI Interview Simulation</h2>
      <JobInput />
      <InterviewChat />
    </div>
  );
}

export default App;
