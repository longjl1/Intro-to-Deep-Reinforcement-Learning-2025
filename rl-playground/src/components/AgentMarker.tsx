'use client';
import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { canAnimateAgent } from '../lib/agent-motion';
import type { Snapshot } from '../lib/rl';

export function AgentMarker({ snap, position, cols, running, fast, speed }: {
  snap: Snapshot | null; position: [number, number]; cols: number; running: boolean; fast: boolean; speed: number;
}) {
  const x = useMotionValue(position[0]), y = useMotionValue(position[1]);
  const scale = useMotionValue(1);
  const previous = useRef<Snapshot | null>(null);
  const reduced = useReducedMotion();
  const [targetX, targetY] = position;
  useEffect(() => {
    const moving = !reduced && canAnimateAgent(previous.current, snap, cols, fast, speed);
    previous.current = snap;
    // Cleanup stops the old animation. Pause/speed changes settle at the snapshot,
    // while a newly stepped action can animate even when the runner is paused.
    if (!moving) {
      x.set(targetX); y.set(targetY); scale.set(1);
      return;
    }
    const duration = running ? Math.min(0.18, 0.8 / speed) : 0.18;
    const controls = [
      animate(x, targetX, { duration, ease: 'easeOut' }),
      animate(y, targetY, { duration, ease: 'easeOut' }),
      animate(scale, [1, 0.92, 1.06, 1], { duration, times: [0, 0.25, 0.7, 1], ease: 'easeInOut' }),
    ];
    return () => controls.forEach(control => control.stop());
  }, [snap, cols, targetX, targetY, running, fast, speed, reduced, x, y, scale]);
  return <motion.g style={{ x, y }} pointerEvents="none" data-testid="agent-marker" data-state={snap?.state}>
    <motion.circle r="9" fill="white" stroke="#000" strokeWidth="2" style={{ scale, transformOrigin: '50% 50%' }} />
  </motion.g>;
}
