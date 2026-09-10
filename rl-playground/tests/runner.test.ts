import test from 'node:test';
import assert from 'node:assert/strict';
import { Runner, type RunnerMessage, type Scheduler } from '../src/lib/runner';
import { DEFAULT_PARAMS, defaultEnv } from '../src/lib/rl';

function harness() {
  let id = 0;
  const jobs = new Map<number, () => void>();
  const messages: RunnerMessage[] = [];
  const clock: Scheduler = { set: fn => { jobs.set(++id, fn); return id; }, clear: handle => { jobs.delete(handle as number); }, now: () => 0 };
  const runner = new Runner(m => messages.push(m), clock);
  const tick = () => { const job = jobs.entries().next().value; assert.ok(job); jobs.delete(job[0]); job[1](); };
  return { runner, messages, jobs, tick, last: () => messages.at(-1)! };
}
const config = { algorithm: 'q-learning' as const, env: defaultEnv('grid'), params: { ...DEFAULT_PARAMS } };

test('pause cancels callbacks, including a previously queued callback', () => {
  const h = harness();
  h.runner.command({ type: 'init', config, seq: 1 });
  h.runner.command({ type: 'run', speed: 10, seq: 2 });
  h.tick(); assert.equal(h.last().snapshot?.steps, 1);
  const stale = h.jobs.values().next().value!;
  h.runner.command({ type: 'pause', seq: 3 });
  assert.equal(h.jobs.size, 0); const after = h.last(); stale(); assert.deepEqual(h.last(), after);
  assert.equal(h.last().running, false);
});
test('reset recreates the seed and ignores stale commands and callbacks', () => {
  const h = harness(); h.runner.command({ type: 'init', config, seq: 1 });
  h.runner.command({ type: 'step', seq: 2 }); const first = h.last().snapshot;
  h.runner.command({ type: 'run', speed: 1000, seq: 3 }); const stale = h.jobs.values().next().value!;
  h.runner.command({ type: 'init', config, seq: 4 }); stale();
  h.runner.command({ type: 'step', seq: 2 }); assert.equal(h.last().snapshot?.steps, 0);
  h.runner.command({ type: 'step', seq: 5 }); assert.deepEqual(h.last().snapshot, first);
});
test('independent runners never share model state', () => {
  const a = harness(), b = harness();
  a.runner.command({ type: 'init', config, seq: 1 }); b.runner.command({ type: 'init', config, seq: 1 });
  a.runner.command({ type: 'step', seq: 2 }); assert.equal(b.last().snapshot?.steps, 0);
  b.runner.command({ type: 'step', seq: 2 }); assert.deepEqual(a.last().snapshot, b.last().snapshot);
});
test('fast training completes exactly 100 episodes and clears old evaluation on learning', () => {
  const h = harness(); h.runner.command({ type: 'init', config, seq: 1 });
  h.runner.command({ type: 'fast', seq: 2 });
  for (let i = 0; i < 1000 && h.last().running; i++) h.tick();
  assert.equal(h.last().running, false); assert.equal(h.last().snapshot?.episodes, 100);
  const trained = h.last().snapshot;
  h.runner.command({ type: 'evaluate', seq: 3 }); assert.ok(h.last().evaluation);
  assert.deepEqual(h.last().snapshot, trained);
  h.runner.command({ type: 'step', seq: 4 }); assert.equal(h.last().evaluation, null);
});
test('fast Monte Carlo flushes all updates belonging to its last completed episode', () => {
  const h = harness();
  h.runner.command({ type: 'init', config: { ...config, algorithm: 'mc' }, seq: 1 });
  h.runner.command({ type: 'fast', seq: 2 });
  for (let i = 0; i < 1000 && h.last().running; i++) h.tick();
  assert.equal(h.last().snapshot?.episodes, 100);
  const updates = h.last().snapshot!.updates;
  h.runner.command({ type: 'step', seq: 3 });
  assert.equal(h.last().snapshot?.updates, updates); // This is a new trajectory step, not a leftover MC update.
});
