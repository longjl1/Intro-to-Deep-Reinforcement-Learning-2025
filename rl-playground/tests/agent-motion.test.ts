import test from 'node:test';
import assert from 'node:assert/strict';
import { RLEngine, defaultEnv, DEFAULT_PARAMS, type Snapshot } from '../src/lib/rl';
import { canAnimateAgent } from '../src/lib/agent-motion';

const initial = new RLEngine({ algorithm: 'q-learning', env: defaultEnv('grid'), params: { ...DEFAULT_PARAMS, seed: 42 } }).snapshot();
const before = { ...initial, state: 30, steps: 2, episodeSteps: 2 };
const after: Snapshot = { ...before, state: 24, steps: 3, episodeSteps: 3, transition: { probability: 1, state: 30, action: 0, nextState: 24, reward: -0.04, terminated: false, truncated: false, event: 'move' } };

test('agent animation follows only an adjacent, single observed environment action', () => {
  assert.equal(canAnimateAgent(before, after, 6, false, 10), true);
  assert.equal(canAnimateAgent(before, { ...after, steps: 8 }, 6, false, 10), false);
  assert.equal(canAnimateAgent(before, { ...after, episodeSteps: 1 }, 6, false, 10), false);
  assert.equal(canAnimateAgent(before, { ...after, transition: { ...after.transition!, state: 18 } }, 6, false, 10), false);
  assert.equal(canAnimateAgent(before, before, 6, false, 10), false);
});

test('cliff teleportation, reset, row wrapping and fast batches snap to the real position', () => {
  assert.equal(canAnimateAgent(before, { ...after, transition: { ...after.transition!, event: 'cliff' } }, 6, false, 10), false);
  assert.equal(canAnimateAgent(null, after, 6, false, 10), false);
  assert.equal(canAnimateAgent(before, null, 6, false, 10), false);
  assert.equal(canAnimateAgent(before, after, 6, true, 10), false);
  assert.equal(canAnimateAgent(before, after, 6, false, 50), false);
  const wrapped = { ...after, state: 6, transition: { ...after.transition!, state: 5, nextState: 6 } };
  assert.equal(canAnimateAgent({ ...before, state: 5 }, wrapped, 6, false, 10), false);
});
