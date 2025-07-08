import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

export default function InterviewerAvatar({ modelUrl = '/models/interviewer.glb', speaking = false, emotion, gesture }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelUrl);
  const { actions } = useAnimations(animations, group);

  useFrame(() => {
    const talkAction = actions?.talk || actions?.Talk;
    if (talkAction) {
      talkAction.paused = !speaking;
      if (speaking && !talkAction.isRunning()) talkAction.play();
    }
  });

  // Future: react to emotion or gesture via additional actions
  return <primitive ref={group} object={scene} dispose={null} />;
}

useGLTF.preload('/models/interviewer.glb');
