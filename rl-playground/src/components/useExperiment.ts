'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExperimentConfig } from '../lib/rl';
import type { Command, RunnerMessage } from '../lib/runner';
type Action = Command extends infer C ? C extends Command ? Omit<C, 'seq'> : never : never;
const EMPTY: RunnerMessage = { seq: 0, snapshot: null, running: false, fast: false, evaluation: null };

export function useExperiment(config: ExperimentConfig, active: boolean) {
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const [record, setRecord] = useState<{ config: ExperimentConfig | null; message: RunnerMessage }>({ config: null, message: EMPTY });
  // The caller memoizes config. Reconfiguration terminates the old worker entirely.
  useEffect(() => {
    setRecord({ config, message: EMPTY });
    if (!active) return;
    let disposed = false;
    const instance = new Worker(new URL('../workers/training.worker.ts', import.meta.url));
    worker.current = instance;
    const id = ++seq.current;
    instance.onmessage = (event: MessageEvent<RunnerMessage>) => {
      if (!disposed && event.data.seq >= seq.current) setRecord({ config, message: event.data });
    };
    instance.onerror = () => { if (!disposed) setRecord({ config, message: { ...EMPTY, error: '训练线程加载失败，请刷新页面后重试。' } }); };
    instance.postMessage({ type: 'init', config, seq: id });
    return () => { disposed = true; instance.terminate(); if (worker.current === instance) worker.current = null; };
  }, [config, active]);
  const send = useCallback((action: Action) => {
    worker.current?.postMessage({ ...action, seq: ++seq.current });
  }, []);
  // Effects run after render: never let an old map's snapshot reach a new map,
  // even for the one render before the old worker is disposed.
  const state = active && record.config === config ? record.message : EMPTY;
  return { ...state, send };
}
