/** Small, inspectable tabular RL. No browser or React dependencies. */
export type Algorithm = 'q-learning' | 'sarsa' | 'expected-sarsa' | 'mc' | 'vi' | 'pi';
export type EnvironmentId = 'grid' | 'cliff' | 'lake';
export type RNG = () => number;
export const ARROWS = ['↑', '→', '↓', '←'];
export const ACTION_NAMES = ['上', '右', '下', '左'];
const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const isPlanning = (algorithm: Algorithm) => algorithm === 'vi' || algorithm === 'pi';
export interface EnvironmentConfig {
  id: EnvironmentId;
  stepReward: number;
  goalReward: number;
  hazardReward: number;
  wallReward: number;
  slip: number;
  maxSteps: number;
}
export interface Params { alpha: number; gamma: number; epsilon: number; seed: number }
export interface ExperimentConfig { algorithm: Algorithm; env: EnvironmentConfig; params: Params }
export const DEFAULT_PARAMS: Params = { alpha: 0.2, gamma: 0.95, epsilon: 0.15, seed: 42 };
export const MAPS: Record<EnvironmentId, string[]> = {
  grid: ['...#.G', '.#....', '.#.#T.', '....#.', '.#....', 'S..T..'],
  cliff: ['............', '............', '............', 'SCCCCCCCCCCG'],
  lake: ['S...', '.H.H', '...H', 'H..G'],
};
export const ENV_NAMES: Record<EnvironmentId, string> = { grid: 'Gridworld', cliff: 'Cliff Walking', lake: 'FrozenLake' };
export const ENV_DESCRIPTIONS: Record<EnvironmentId, string> = {
  grid: '绕过墙壁与陷阱，找到通往终点的路径。',
  cliff: '跌落悬崖返回起点，回合继续。安全与捷径如何取舍？',
  lake: '脚下的冰面会让动作偏移。学习在不确定性中抵达终点。',
};
export function defaultEnv(id: EnvironmentId): EnvironmentConfig {
  return {
    id, maxSteps: 500, slip: id === 'lake' ? 2 / 3 : 0,
    stepReward: id === 'cliff' ? -1 : id === 'lake' ? 0 : -0.04,
    goalReward: id === 'cliff' ? -1 : id === 'lake' ? 1 : 10,
    hazardReward: id === 'cliff' ? -100 : id === 'lake' ? 0 : -10,
    wallReward: id === 'cliff' ? -1 : id === 'lake' ? 0 : -0.25,
  };
}
export function seededRng(seed: number): RNG {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}
export function bestActions(values: number[]): number[] {
  const best = Math.max(...values);
  return values.flatMap((v, a) => Math.abs(v - best) < 1e-10 ? [a] : []);
}
export function epsilonProbabilities(values: number[], epsilon: number): number[] {
  const best = bestActions(values);
  return values.map((_, a) => epsilon / values.length + (best.includes(a) ? (1 - epsilon) / best.length : 0));
}
export function draw(probabilities: number[], rng: RNG): number {
  let x = rng();
  for (let i = 0; i < probabilities.length; i++) {
    x -= probabilities[i];
    if (x < 0) return i;
  }
  return probabilities.length - 1;
}
export interface Outcome { probability: number; nextState: number; reward: number; terminated: boolean; event: string }
export interface Transition extends Outcome { state: number; action: number; truncated: boolean }

export class GridEnvironment {
  readonly layout: string[];
  readonly rows: number;
  readonly cols: number;
  readonly size: number;
  readonly start: number;
  readonly active: number[];
  readonly config: EnvironmentConfig;
  constructor(config: EnvironmentConfig, layout = MAPS[config.id]) {
    this.config = { ...config };
    this.layout = [...layout];
    this.rows = layout.length;
    this.cols = layout[0]?.length ?? 0;
    if (!this.cols || layout.some(row => row.length !== this.cols) || !/^[.SG#THC]+$/.test(layout.join(''))) throw new Error('地图格式无效');
    if (layout.join('').split('S').length !== 2 || layout.join('').split('G').length !== 2) throw new Error('地图必须有一个起点和终点');
    if (!Number.isFinite(config.slip) || config.slip < 0 || config.slip > 1 || !Number.isInteger(config.maxSteps) || config.maxSteps < 1) throw new Error('环境参数无效');
    if (![config.stepReward, config.goalReward, config.hazardReward, config.wallReward].every(Number.isFinite)) throw new Error('奖励必须是有限数值');
    this.size = this.rows * this.cols;
    this.start = layout.join('').indexOf('S');
    this.active = Array.from({ length: this.size }, (_, s) => s).filter(s => !this.isTerminal(s) && !['#', 'C'].includes(this.cell(s)));
  }
  cell(s: number): string { return this.layout[Math.floor(s / this.cols)]?.[s % this.cols] ?? '#'; }
  isTerminal(s: number): boolean { return ['G', 'T', 'H'].includes(this.cell(s)); }
  private outcome(s: number, a: number): Omit<Outcome, 'probability'> {
    if (this.isTerminal(s)) return { nextState: s, reward: 0, terminated: true, event: 'terminal' };
    const row = Math.floor(s / this.cols) + DELTAS[a][0];
    const col = s % this.cols + DELTAS[a][1];
    const next = row * this.cols + col;
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || this.cell(next) === '#') {
      return { nextState: s, reward: this.config.wallReward, terminated: false, event: 'wall' };
    }
    const cell = this.cell(next);
    if (cell === 'C') return { nextState: this.start, reward: this.config.hazardReward, terminated: false, event: 'cliff' };
    return {
      nextState: next, reward: cell === 'G' ? this.config.goalReward : ['T', 'H'].includes(cell) ? this.config.hazardReward : this.config.stepReward,
      terminated: this.isTerminal(next), event: cell === 'G' ? 'goal' : ['T', 'H'].includes(cell) ? 'hazard' : 'move',
    };
  }
  transitions(s: number, a: number): Outcome[] {
    if (!Number.isInteger(a) || a < 0 || a > 3) throw new Error('动作无效');
    const slip = this.config.slip;
    return [[a, 1 - slip], [(a + 3) % 4, slip / 2], [(a + 1) % 4, slip / 2]]
      .filter(([, p]) => p > 0).map(([action, probability]) => ({ probability, ...this.outcome(s, action) }));
  }
  sample(s: number, a: number, step: number, rng: RNG): Transition {
    const outcomes = this.transitions(s, a);
    const result = outcomes[draw(outcomes.map(o => o.probability), rng)];
    return { ...result, state: s, action: a, truncated: !result.terminated && step >= this.config.maxSteps };
  }
  actionValues(s: number, values: number[], gamma: number): number[] {
    return [0, 1, 2, 3].map(a => this.transitions(s, a).reduce((sum, t) => sum + t.probability * (t.reward + (t.terminated ? 0 : gamma * values[t.nextState])), 0));
  }
}

export interface Update { state: number; action: number | null; oldValue: number; target: number; newValue: number; error: number; formula: string; detail: string; line: number }
export interface Point { x: number; y: number; success?: boolean; truncated?: boolean }
export interface Snapshot {
  algorithm: Algorithm; values: number[]; q: number[][]; policy: number[]; visits: number[];
  state: number; trace: number[]; steps: number; episodes: number; episodeSteps: number; episodeReturn: number;
  updates: number; sweeps: number; iterations: number; delta: number; phase: string; converged: boolean;
  successes: number; truncations: number; history: Point[]; last: Update | null; transition: Transition | null;
}
const fmt = (n: number) => n.toFixed(3);
export function tdUpdate(algorithm: 'q-learning' | 'sarsa' | 'expected-sarsa', oldValue: number, reward: number, nextValues: number[], nextAction: number, terminated: boolean, params: Params) {
  const future = terminated ? 0 : algorithm === 'q-learning' ? Math.max(...nextValues) : algorithm === 'sarsa' ? nextValues[nextAction] : epsilonProbabilities(nextValues, params.epsilon).reduce((sum, p, a) => sum + p * nextValues[a], 0);
  const target = reward + params.gamma * future;
  return { future, target, error: target - oldValue, newValue: oldValue + params.alpha * (target - oldValue) };
}
/** First visit is determined in chronological order, even though returns are computed backwards. */
export function firstVisitReturns(episode: Transition[], gamma: number): { state: number; action: number; target: number }[] {
  const returns = Array<number>(episode.length);
  let g = 0;
  for (let i = episode.length - 1; i >= 0; i--) returns[i] = g = episode[i].reward + gamma * g;
  const seen = new Set<string>();
  return episode.flatMap((t, i) => {
    const key = `${t.state}:${t.action}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ state: t.state, action: t.action, target: returns[i] }];
  });
}

export class RLEngine {
  readonly config: ExperimentConfig;
  readonly env: GridEnvironment;
  private rng: RNG;
  q: number[][];
  values: number[];
  policy: number[];
  private visits: number[];
  private counts: number[][];
  private state: number;
  private action: number | null = null;
  private trace: number[];
  private episode: Transition[] = [];
  private mcPending: ReturnType<typeof firstVisitReturns> = [];
  private needsReset = false;
  private cursor = 0;
  private previousValues: number[];
  private stable = true;
  private sweepDelta = 0;
  private phase: 'sample' | 'mc-update' | 'value' | 'evaluate' | 'improve';
  private last: Update | null = null;
  private transition: Transition | null = null;
  steps = 0;
  episodes = 0;
  episodeSteps = 0;
  episodeReturn = 0;
  updates = 0;
  sweeps = 0;
  iterations = 0;
  delta = 0;
  successes = 0;
  truncations = 0;
  converged = false;
  private history: Point[] = [];
  constructor(config: ExperimentConfig, layout?: string[]) {
    this.config = structuredClone(config);
    const p = config.params;
    if (![p.alpha, p.epsilon].every(x => Number.isFinite(x) && x >= 0 && x <= 1) || !Number.isFinite(p.gamma) || p.gamma < 0 || p.gamma >= 1 || !Number.isInteger(p.seed)) throw new Error('算法参数无效：γ 必须小于 1');
    this.env = new GridEnvironment(config.env, layout);
    this.rng = seededRng(p.seed);
    this.q = Array.from({ length: this.env.size }, () => [0, 0, 0, 0]);
    this.counts = this.q.map(row => [...row]);
    this.values = Array(this.env.size).fill(0);
    this.previousValues = [...this.values];
    this.policy = Array(this.env.size).fill(0);
    this.visits = Array(this.env.size).fill(0);
    this.state = this.env.start;
    this.trace = [this.state];
    this.phase = config.algorithm === 'vi' ? 'value' : config.algorithm === 'pi' ? 'evaluate' : 'sample';
  }
  private choose(state: number): number { return draw(epsilonProbabilities(this.q[state], this.config.params.epsilon), this.rng); }
  get hasPendingUpdates(): boolean { return this.mcPending.length > 0; }
  advance(): void {
    if (this.converged) return;
    if (isPlanning(this.config.algorithm)) { this.advancePlanning(); return; }
    if (this.mcPending.length) { this.advanceMC(); return; }
    if (this.needsReset) {
      this.state = this.env.start; this.action = null; this.trace = [this.state];
      this.episode = []; this.episodeSteps = 0; this.episodeReturn = 0; this.needsReset = false;
    }
    this.phase = 'sample';
    const s = this.state;
    const a = this.action ?? this.choose(s);
    const t = this.env.sample(s, a, this.episodeSteps + 1, this.rng);
    this.steps++; this.episodeSteps++; this.episodeReturn += t.reward; this.visits[s]++;
    this.transition = t; this.state = t.nextState; this.trace.push(this.state);
    const nextAction = !t.terminated && this.config.algorithm === 'sarsa' ? this.choose(t.nextState) : 0;
    if (this.config.algorithm === 'mc') {
      this.episode.push(t);
      this.last = { state: s, action: a, oldValue: this.q[s][a], target: 0, newValue: this.q[s][a], error: 0, formula: '轨迹 ← 轨迹 + (s, a, r)', detail: `已收集 ${this.episode.length} 步；完整回合结束后计算回报。`, line: 1 };
    } else {
      const oldValue = this.q[s][a];
      const update = tdUpdate(this.config.algorithm as 'q-learning' | 'sarsa' | 'expected-sarsa', oldValue, t.reward, this.q[t.nextState], nextAction, t.terminated, this.config.params);
      this.q[s][a] = update.newValue; this.updates++;
      this.last = { state: s, action: a, oldValue, ...update, formula: `${fmt(oldValue)} + ${this.config.params.alpha} × (${fmt(t.reward)} + ${this.config.params.gamma} × ${fmt(update.future)} − ${fmt(oldValue)}) = ${fmt(update.newValue)}`, detail: t.terminated ? '真正终止：未来价值为 0。' : t.truncated ? '达到步数上限：保留下一状态的 bootstrap，不当作终止。' : this.config.algorithm === 'sarsa' ? `下一实际动作：${ACTION_NAMES[nextAction]}。` : this.config.algorithm === 'expected-sarsa' ? '未来价值是 ε-greedy 策略下四个动作价值的加权平均。' : '未来价值取下一状态的最大 Q 值。', line: 2 };
    }
    this.action = this.config.algorithm === 'sarsa' ? nextAction : null;
    if (t.terminated || t.truncated) {
      this.episodes++; this.successes += Number(t.event === 'goal'); this.truncations += Number(t.truncated);
      this.record({ x: this.episodes, y: this.episodeReturn, success: t.event === 'goal', truncated: t.truncated });
      this.needsReset = true;
      if (this.config.algorithm === 'mc') {
        this.mcPending = t.terminated ? firstVisitReturns(this.episode, this.config.params.gamma) : [];
        if (t.truncated && this.last) this.last.detail = '回合截断：丢弃该回合的回报样本，不更新 Q。';
      }
    }
  }
  private advanceMC(): void {
    this.phase = 'mc-update';
    const item = this.mcPending.shift()!;
    const { state, action, target } = item;
    const n = ++this.counts[state][action];
    const oldValue = this.q[state][action];
    const newValue = oldValue + (target - oldValue) / n;
    this.q[state][action] = newValue; this.updates++;
    this.last = { state, action, oldValue, target, newValue, error: target - oldValue, formula: `${fmt(oldValue)} + (${fmt(target)} − ${fmt(oldValue)}) / ${n} = ${fmt(newValue)}`, detail: `该状态动作对的第 ${n} 个 first-visit 样本；折扣回报 G = ${fmt(target)}。`, line: 3 };
  }
  private advancePlanning(): void {
    const s = this.env.active[this.cursor];
    this.state = s;
    const q = this.env.actionValues(s, this.previousValues, this.config.params.gamma);
    this.q[s] = q;
    const oldValue = this.values[s];
    if (this.phase === 'improve') {
      const previous = this.policy[s];
      const best = bestActions(q);
      this.policy[s] = best.includes(previous) ? previous : best[0];
      if (previous !== this.policy[s]) this.stable = false;
      this.last = { state: s, action: this.policy[s], oldValue, target: Math.max(...q), newValue: oldValue, error: 0, formula: `π(s) : ${ARROWS[previous]} → ${ARROWS[this.policy[s]]}`, detail: `各动作期望回报：[${q.map(fmt).join(', ')}]；相同价值时保留原动作。`, line: 3 };
    } else {
      const target = this.phase === 'value' ? Math.max(...q) : q[this.policy[s]];
      this.values[s] = target;
      if (this.phase === 'value') this.policy[s] = bestActions(q)[0];
      this.sweepDelta = Math.max(this.sweepDelta, Math.abs(target - oldValue));
      this.last = { state: s, action: this.phase === 'value' ? this.policy[s] : null, oldValue, target, newValue: target, error: target - oldValue, formula: `V(s): ${fmt(oldValue)} → ${fmt(target)}`, detail: `${this.phase === 'value' ? 'maxₐ' : `动作 ${ARROWS[this.policy[s]]}：`} Σ P(s′|s,a)[r + γV(s′)]；四方向期望值 [${q.map(fmt).join(', ')}]。`, line: this.phase === 'value' ? 1 : 1 };
    }
    this.updates++; this.visits[s]++; this.cursor++;
    if (this.cursor === this.env.active.length) {
      this.cursor = 0;
      if (this.phase === 'improve') {
        this.iterations++;
        if (this.stable) this.converged = true;
        this.phase = 'evaluate';
      } else {
        this.sweeps++; this.delta = this.sweepDelta;
        this.record({ x: this.sweeps, y: this.delta });
        if (this.delta < 1e-6) {
          if (this.phase === 'value') this.converged = true;
          else { this.phase = 'improve'; this.stable = true; }
        }
      }
      this.sweepDelta = 0;
      this.previousValues = [...this.values];
    }
  }
  private record(point: Point): void { this.history.push(point); if (this.history.length > 300) this.history.shift(); }
  snapshot(): Snapshot {
    const planning = isPlanning(this.config.algorithm);
    return {
      algorithm: this.config.algorithm, values: planning ? [...this.values] : this.q.map(row => Math.max(...row)),
      q: this.q.map(row => [...row]), policy: planning ? [...this.policy] : this.q.map(row => bestActions(row)[0]), visits: [...this.visits],
      state: this.state, trace: this.trace.slice(-500), steps: this.steps, episodes: this.episodes,
      episodeSteps: this.episodeSteps, episodeReturn: this.episodeReturn, updates: this.updates, sweeps: this.sweeps,
      iterations: this.iterations, delta: this.delta, phase: this.converged ? 'converged' : this.phase, converged: this.converged,
      successes: this.successes, truncations: this.truncations, history: this.history.map(p => ({ ...p })), last: this.last ? { ...this.last } : null,
      transition: this.transition ? { ...this.transition } : null,
    };
  }
}

export interface Evaluation { meanReturn: number; successRate: number; meanSuccessSteps: number | null; timeouts: number; failures: number; episodes: number }
/** Read-only, same seeds for every algorithm. Greedy ties are sampled uniformly. */
export function evaluatePolicy(engine: RLEngine, seed = 2026, episodes = 100): Evaluation {
  const snap = engine.snapshot();
  const env = new GridEnvironment({ ...engine.config.env, maxSteps: 500 }, engine.env.layout);
  let total = 0, successes = 0, successSteps = 0, timeouts = 0, failures = 0;
  for (let i = 0; i < episodes; i++) {
    const rng = seededRng(seed + i * 9973);
    let s = env.start;
    for (let step = 1; step <= 500; step++) {
      const action = isPlanning(snap.algorithm) ? snap.policy[s] : draw(epsilonProbabilities(snap.q[s], 0), rng);
      const t = env.sample(s, action, step, rng);
      total += t.reward; s = t.nextState;
      if (t.terminated || t.truncated) {
        if (t.event === 'goal') { successes++; successSteps += step; }
        else if (t.truncated) timeouts++;
        else failures++;
        break;
      }
    }
  }
  return { meanReturn: total / episodes, successRate: successes / episodes, meanSuccessSteps: successes ? successSteps / successes : null, timeouts, failures, episodes };
}
