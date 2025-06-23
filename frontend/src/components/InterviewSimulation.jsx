import React from 'react';

export default function InterviewSimulation({ onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#111', color: 'white' }}>
      <div style={{ padding: '10px', background: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Interview Simulation</span>
        <button onClick={onBack} style={{ padding: '6px 12px', background: '#eee', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          ← Back
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '80%', height: '80%', background: '#555', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
            <p>Interviewer Video Placeholder</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ flex: 1, background: '#222', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <p>Your Video</p>
          </div>
          <button style={{ padding: '8px', background: '#28a745', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white' }}>Mute</button>
          <button style={{ padding: '8px', background: '#dc3545', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white' }}>Leave</button>
        </div>
      </div>
    </div>
  );
}
