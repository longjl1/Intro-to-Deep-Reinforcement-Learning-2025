import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PARAMS, GridEnvironment, MAPS, RLEngine, defaultEnv, epsilonProbabilities, evaluatePolicy, firstVisitReturns, isPlanning, seededRng, tdUpdate, type Algorithm, type ExperimentConfig, type Transition } from '../src/lib/rl';

const close = (a: number, b: number, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const config = (algorithm: Algorithm, overrides: Partial<ExperimentConfig> = {}): ExperimentConfig => ({ algorithm, env: defaultEnv('grid'), params: { ...DEFAULT_PARAMS }, ...overrides });
const toy = (algorithm: Algorithm) => new RLEngine(config(algorithm, { env: { ...defaultEnv('grid'), stepReward: -1, wallReward: -1, goalReward: 5 }, params: { ...DEFAULT_PARAMS, gamma: 0.9 } }), ['S.G']);
const finish = (engine: RLEngine) => { for (let i = 0; i < 50000 && !engine.converged; i++) engine.advance(); assert.ok(engine.converged); };

test('seeded randomness is reproducible and different seeds diverge', () => {
  const a = seededRng(42), b = seededRng(42), c = seededRng(43);
  const expected = Array.from({ length: 100 }, () => a());
  assert.deepEqual(expected, Array.from({ length: 100 }, () => b()));
  assert.notDeepEqual(expected, Array.from({ length: 100 }, () => c()));
  assert.ok(expected.every(v => v >= 0 && v < 1));
});
test('epsilon-greedy distributes exploit mass over every tied optimum', () => {
  const p = epsilonProbabilities([2, 2, 0, -1], 0.2);
  p.forEach((v, i) => close(v, [0.45, 0.45, 0.05, 0.05][i]));
  assert.deepEqual(epsilonProbabilities([0, 0, 0, 0], 0), [0.25, 0.25, 0.25, 0.25]);
  assert.deepEqual(epsilonProbabilities([1, 0, 0, 0], 1), [0.25, 0.25, 0.25, 0.25]);
});
test('all preset transition models are normalized; terminal values do not bootstrap', () => {
  for (const id of ['grid', 'cliff', 'lake'] as const) {
    const env = new GridEnvironment({ ...defaultEnv(id), slip: 0.37 });
    for (const s of env.active) for (let a = 0; a < 4; a++) {
      const outcomes = env.transitions(s, a);
      close(outcomes.reduce((sum, t) => sum + t.probability, 0), 1);
      assert.ok(outcomes.every(t => t.nextState >= 0 && t.nextState < env.size));
    }
    const goal = env.layout.join('').indexOf('G');
    assert.deepEqual(env.actionValues(goal, Array(env.size).fill(100), 0.9), [0, 0, 0, 0]);
  }
});
test('Cliff Walking falls back to start without ending the episode', () => {
  const env = new GridEnvironment(defaultEnv('cliff'));
  const t = env.sample(env.start, 1, 1, seededRng(42));
  assert.equal(t.nextState, env.start); assert.equal(t.reward, -100);
  assert.equal(t.event, 'cliff'); assert.equal(t.terminated, false); assert.equal(t.truncated, false);
});
test('FrozenLake reaches terminal holes and uses left/right slip branches', () => {
  const env = new GridEnvironment({ ...defaultEnv('lake'), slip: 0 });
  const hole = env.sample(4, 1, 1, seededRng(42));
  assert.equal(hole.nextState, 5); assert.equal(hole.terminated, true); assert.equal(hole.reward, 0);
  const slippery = new GridEnvironment({ ...defaultEnv('lake'), slip: 0.6 });
  assert.deepEqual(slippery.transitions(0, 1).map(t => t.nextState), [1, 0, 4]);
  slippery.transitions(0, 1).forEach((t, i) => close(t.probability, [0.4, 0.3, 0.3][i]));
});
test('sampling frequencies agree with the same model used by planning', () => {
  const env = new GridEnvironment({ ...defaultEnv('grid'), slip: 0.4 });
  const rng = seededRng(5); const counts = new Map<number, number>();
  for (let i = 0; i < 20000; i++) { const t = env.sample(0, 1, 1, rng); counts.set(t.nextState, (counts.get(t.nextState) ?? 0) + 1); }
  const expected = new Map<number, number>();
  for (const t of env.transitions(0, 1)) expected.set(t.nextState, (expected.get(t.nextState) ?? 0) + t.probability);
  for (const [state, probability] of expected) close((counts.get(state) ?? 0) / 20000, probability, 0.015);
});
test('hand-calculated targets distinguish Q-learning, SARSA, and Expected SARSA', () => {
  const p = { ...DEFAULT_PARAMS, alpha: 0.5, gamma: 0.9, epsilon: 0.2 };
  const next = [2, 4, 0, -2];
  close(tdUpdate('q-learning', 1, 2, next, 0, false, p).newValue, 3.3);
  close(tdUpdate('sarsa', 1, 2, next, 0, false, p).newValue, 2.4);
  const expected = 0.05 * 2 + 0.85 * 4 + 0.05 * 0 + 0.05 * -2;
  close(tdUpdate('expected-sarsa', 1, 2, next, 0, false, p).newValue, 1 + 0.5 * (2 + 0.9 * expected - 1));
  for (const a of ['q-learning', 'sarsa', 'expected-sarsa'] as const) close(tdUpdate(a, 1, 2, next, 0, true, p).newValue, 1.5);
});
test('TD time limit preserves bootstrap; true termination wins at step limit', () => {
  const env = new GridEnvironment({ ...defaultEnv('grid'), maxSteps: 1 }, ['SG']);
  const timeout = env.sample(0, 0, 1, seededRng(1));
  assert.equal(timeout.truncated, true); assert.equal(timeout.terminated, false);
  close(tdUpdate('q-learning', 0, 0, [2, 0, 0, 0], 0, timeout.terminated, DEFAULT_PARAMS).newValue, 0.38);
  const goal = env.sample(0, 1, 1, seededRng(1));
  assert.equal(goal.terminated, true); assert.equal(goal.truncated, false);
});
test('SARSA executes the actual next action used in its update', () => {
  const engine = toy('sarsa');
  engine.advance();
  const first = engine.snapshot();
  assert.equal(first.transition?.terminated, false);
  const chosen = first.last?.detail.match(/下一实际动作：(.)。/)?.[1];
  assert.ok(chosen);
  engine.advance();
  assert.equal(['上', '右', '下', '左'][engine.snapshot().transition!.action], chosen);
});
test('Monte Carlo first visit uses the first occurrence, with correct discounted return', () => {
  const t = (state: number, reward: number): Transition => ({ state, action: 0, reward, probability: 1, nextState: 0, terminated: false, truncated: false, event: 'move' });
  const returns = firstVisitReturns([t(0, 1), t(1, 2), t(0, 3)], 0.5);
  assert.deepEqual(returns, [{ state: 0, action: 0, target: 2.75 }, { state: 1, action: 0, target: 3.5 }]);
});
test('Monte Carlo waits for termination, then applies a sample mean; timeout does not update', () => {
  const c = config('mc', { params: { ...DEFAULT_PARAMS, epsilon: 0 }, env: { ...defaultEnv('grid'), maxSteps: 1, goalReward: 10 } });
  const engine = new RLEngine(c, ['SG']);
  engine.q[0][1] = 1;
  engine.advance(); assert.equal(engine.q[0][1], 1); assert.equal(engine.episodes, 1);
  engine.advance(); close(engine.q[0][1], 10); assert.equal(engine.snapshot().phase, 'mc-update');
  engine.advance(); engine.advance(); close(engine.q[0][1], 10);
  const timeout = new RLEngine(c, ['S.G']); timeout.q[0][0] = 1;
  timeout.advance(); assert.equal(timeout.truncations, 1); assert.equal(timeout.updates, 0);
  assert.equal(timeout.hasPendingUpdates, false); assert.equal(timeout.q[0][0], 1);
});
test('Value Iteration uses previous-sweep values and a hand-calculated Bellman update', () => {
  const engine = toy('vi');
  engine.advance(); close(engine.snapshot().values[0], -1);
  engine.advance(); close(engine.snapshot().values[1], 5);
  engine.advance(); close(engine.snapshot().values[0], 3.5);
});
test('VI and PI converge to the known optimal solution and stable policy', () => {
  const vi = toy('vi'), pi = toy('pi'); finish(vi); finish(pi);
  close(vi.values[0], 3.5, 1e-5); close(pi.values[0], 3.5, 1e-5);
  for (const s of vi.env.active) { close(vi.values[s], pi.values[s], 1e-5); assert.equal(pi.policy[s], 1); }
  const snapshot = pi.snapshot(); pi.advance(); assert.deepEqual(pi.snapshot(), snapshot);
  assert.ok(pi.iterations > 0);
});
test('all four sampled algorithms learn a successful greedy policy with a fixed seed', () => {
  for (const algorithm of ['q-learning', 'sarsa', 'expected-sarsa', 'mc'] as Algorithm[]) {
    const engine = toy(algorithm);
    for (let i = 0; i < 20000; i++) engine.advance();
    const result = evaluatePolicy(engine);
    assert.equal(result.successRate, 1, algorithm);
    assert.equal(result.meanSuccessSteps, 2, algorithm);
    assert.ok(engine.updates > 0);
  }
});
test('VI and PI agree on all preset MDPs, including stochastic FrozenLake', () => {
  for (const id of ['grid', 'cliff', 'lake'] as const) {
    const vi = new RLEngine(config('vi', { env: defaultEnv(id) }));
    const pi = new RLEngine(config('pi', { env: defaultEnv(id) }));
    finish(vi); finish(pi);
    for (const s of vi.env.active) close(vi.values[s], pi.values[s], 5e-5);
    if (id !== 'lake') {
      assert.equal(evaluatePolicy(vi).successRate, 1);
      assert.equal(evaluatePolicy(pi).successRate, 1);
    }
  }
});
test('snapshots and evaluation are read-only; evaluation does not perturb future training RNG', () => {
  const a = toy('q-learning'), b = toy('q-learning');
  for (let i = 0; i < 40; i++) { a.advance(); b.advance(); }
  const before = a.snapshot();
  assert.deepEqual(evaluatePolicy(a), evaluatePolicy(a)); assert.deepEqual(a.snapshot(), before);
  const edited = a.snapshot(); edited.q[0][0] = 999; edited.trace.push(999); edited.history[0].y = 999;
  assert.deepEqual(a.snapshot(), before);
  for (let i = 0; i < 100; i++) { a.advance(); b.advance(); }
  assert.deepEqual(a.snapshot(), b.snapshot());
});
test('every algorithm and environment combination produces finite snapshots', () => {
  for (const algorithm of ['q-learning', 'sarsa', 'expected-sarsa', 'mc', 'vi', 'pi'] as Algorithm[]) {
    for (const id of ['grid', 'cliff', 'lake'] as const) {
      const engine = new RLEngine(config(algorithm, { env: defaultEnv(id) }));
      for (let i = 0; i < 1800; i++) engine.advance();
      const snap = engine.snapshot();
      assert.equal(snap.values.length, MAPS[id].join('').length);
      assert.ok(snap.values.every(Number.isFinite));
      assert.ok(snap.q.flat().every(Number.isFinite));
      assert.ok(isPlanning(algorithm) ? snap.updates > 0 : snap.steps > 0);
      const evaluation = evaluatePolicy(engine, 42, 3);
      assert.equal(evaluation.episodes, 3);
      assert.ok(Number.isFinite(evaluation.meanReturn));
    }
  }
});
test('evaluation accounts for timeouts, failures and undefined successful path length', () => {
  const engine = toy('pi'); // Initial policy always moves up, so never reaches the goal.
  const result = evaluatePolicy(engine);
  assert.equal(result.timeouts, 100); assert.equal(result.failures, 0);
  assert.equal(result.meanSuccessSteps, null); assert.equal(result.successRate, 0);
});
test('invalid model and algorithm parameters fail explicitly', () => {
  assert.throws(() => new RLEngine(config('vi', { params: { ...DEFAULT_PARAMS, gamma: 1 } })));
  assert.throws(() => new GridEnvironment({ ...defaultEnv('grid'), slip: 2 }));
  assert.throws(() => new GridEnvironment(defaultEnv('grid'), ['SSG']));
});
