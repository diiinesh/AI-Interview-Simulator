import React from 'react';
import { Canvas } from '@react-three/fiber';

export default function InterviewSimulation({ onEnd }) {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-gray-800">
          <Canvas className="w-full h-full">
            {/* 3D interviewer scene goes here */}
          </Canvas>
        </div>
        <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto hidden md:block">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <div id="transcript" className="space-y-1 text-sm">
            {/* Transcript messages will be inserted here */}
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
