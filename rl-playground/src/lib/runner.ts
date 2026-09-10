import { RLEngine, evaluatePolicy, isPlanning, type ExperimentConfig, type Snapshot, type Evaluation } from './rl';

export type Command = { seq: number } & (
  { type: 'init'; config: ExperimentConfig } | { type: 'run'; speed: number } |
  { type: 'pause' | 'step' | 'fast' | 'evaluate' } | { type: 'speed'; speed: number }
);
export interface RunnerMessage { seq: number; snapshot: Snapshot | null; running: boolean; fast: boolean; evaluation: Evaluation | null; error?: string }
export interface Scheduler { set: (fn: () => void, delay: number) => unknown; clear: (handle: unknown) => void; now: () => number }
const defaultScheduler: Scheduler = { set: (fn, delay) => setTimeout(fn, delay), clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>), now: () => performance.now() };

/** Scheduling is separated from the worker transport so cancellation is testable. */
export class Runner {
  private engine: RLEngine | null = null;
  private seq = 0;
  private timer: unknown = null;
  private token = 0;
  private running = false;
  private fast = false;
  private target = 0;
  private speed = 10;
  private evaluation: Evaluation | null = null;
  constructor(private emit: (message: RunnerMessage) => void, private clock: Scheduler = defaultScheduler) {}
  private stop(): void {
    this.token++;
    if (this.timer !== null) this.clock.clear(this.timer);
    this.timer = null; this.running = false; this.fast = false;
  }
  private send(error?: string): void { this.emit({ seq: this.seq, snapshot: this.engine?.snapshot() ?? null, running: this.running, fast: this.fast, evaluation: this.evaluation, error }); }
  command(command: Command): void {
    if (command.seq < this.seq) return;
    this.seq = command.seq;
    try {
      if (command.type === 'speed') { this.speed = Math.max(1, Math.min(1000, command.speed)); this.send(); return; }
      this.stop();
      if (command.type === 'init') { this.engine = new RLEngine(command.config); this.evaluation = null; }
      if (!this.engine) return;
      if (command.type === 'evaluate') this.evaluation = evaluatePolicy(this.engine);
      if (command.type === 'step') { this.evaluation = null; this.engine.advance(); }
      if (command.type === 'run' || command.type === 'fast') {
        this.evaluation = null;
        if (command.type === 'run') this.speed = Math.max(1, Math.min(1000, command.speed));
        this.fast = command.type === 'fast';
        this.target = (isPlanning(this.engine.config.algorithm) ? this.engine.sweeps : this.engine.episodes) + 100;
        this.running = !this.engine.converged;
        if (this.running) this.schedule();
      }
      this.send();
    } catch (error) { this.stop(); this.send(error instanceof Error ? error.message : String(error)); }
  }
  private schedule(): void {
    const token = this.token;
    const delay = this.fast ? 16 : Math.max(32, 1000 / this.speed);
    this.timer = this.clock.set(() => {
      if (token !== this.token || !this.running || !this.engine) return;
      try {
        const start = this.clock.now();
        const count = this.fast ? 1000 : Math.max(1, Math.floor(this.speed / 30));
        for (let i = 0; i < count; i++) {
          this.engine.advance();
          const units = isPlanning(this.engine.config.algorithm) ? this.engine.sweeps : this.engine.episodes;
          if (this.engine.converged || (this.fast && units >= this.target && !this.engine.hasPendingUpdates)) { this.stop(); break; }
          if (this.clock.now() - start >= 8) break;
        }
        this.send();
        if (this.running) this.schedule();
      } catch (error) { this.stop(); this.send(error instanceof Error ? error.message : String(error)); }
    }, delay);
  }
}
