'use client';
import { useEffect, useMemo, useState } from 'react';
import { ALGORITHM_ORDER, LESSONS, PHASES } from '../lib/lessons';
import { ACTION_NAMES, ARROWS, DEFAULT_PARAMS, ENV_DESCRIPTIONS, ENV_NAMES, GridEnvironment, defaultEnv, isPlanning, type Algorithm, type EnvironmentConfig, type EnvironmentId, type Params, type Snapshot } from '../lib/rl';
import { useExperiment } from './useExperiment';
import { Board, Icon, LearningChart, MiniMap } from './Visuals';
import { Button } from './animate-ui/components/buttons/button';
import { Switch } from './animate-ui/components/radix/switch';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './animate-ui/components/radix/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './animate-ui/components/radix/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from './animate-ui/components/radix/tooltip';
import styles from './Playground.module.css';

type Experiment = ReturnType<typeof useExperiment>;
function AlgorithmSelect({ value, onChange, label }: { value: Algorithm; onChange: (a: Algorithm) => void; label: string }) {
  return <label className={styles.field}><span>{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value as Algorithm)}>{ALGORITHM_ORDER.map(a => <option key={a} value={a}>{LESSONS[a].name}</option>)}</select></label>;
}
function NumericField({ label, value, onChange, min = -1000, max = 1000, step = 0.01 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() && Number.isFinite(n) && n >= min && n <= max && (step !== 1 || Number.isInteger(n))) { if (n !== value) onChange(n); }
    else setDraft(String(value));
  };
  return <label className={styles.numeric}><span>{label}</span><input type="number" min={min} max={max} step={step} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>;
}
function Parameters({ algorithm, params, onChange, prefix = '' }: { algorithm: Algorithm; params: Params; onChange: (p: Params) => void; prefix?: string }) {
  return <div className={styles.parameters}>
    {!isPlanning(algorithm) && algorithm !== 'mc' && <NumericField label={`${prefix}学习率 α`} value={params.alpha} min={0} max={1} onChange={alpha => onChange({ ...params, alpha })} />}
    <NumericField label={`${prefix}折扣因子 γ`} value={params.gamma} min={0} max={0.999} step={0.01} onChange={gamma => onChange({ ...params, gamma })} />
    {!isPlanning(algorithm) && <NumericField label={`${prefix}探索率 ε`} value={params.epsilon} min={0} max={1} onChange={epsilon => onChange({ ...params, epsilon })} />}
  </div>;
}
function PlayButton({ running, disabled, onClick, label, small = false }: { running: boolean; disabled: boolean; onClick: () => void; label: string; small?: boolean }) {
  return <Tooltip delayDuration={350}><TooltipTrigger asChild><Button variant="ghost" size="icon" className={`${styles.play} ${small ? styles.smallPlay : ''}`} disabled={disabled} onClick={onClick} aria-label={label}><span className="t-icon-swap" data-state={running ? 'b' : 'a'}><span className="t-icon" data-icon="a"><Icon name="play" size={small ? 18 : 22} /></span><span className="t-icon" data-icon="b"><Icon name="pause" size={small ? 18 : 22} /></span></span></Button></TooltipTrigger><TooltipContent sideOffset={8}>{label}</TooltipContent></Tooltip>;
}
function StateInspector({ snap, env, selected }: { snap: Snapshot | null; env: EnvironmentConfig; selected: number }) {
  const model = new GridEnvironment(env);
  const q = snap?.q[selected] ?? [0, 0, 0, 0];
  const valid = model.active.includes(selected);
  const planning = snap ? isPlanning(snap.algorithm) : false;
  return <div className={styles.inspector}>
    <div className={styles.inspectorTitle}><span>状态 <b>({Math.floor(selected / model.cols) + 1}, {selected % model.cols + 1})</b></span><span>V = <b>{(snap?.values[selected] ?? 0).toFixed(3)}</b></span><small>{valid ? planning ? '最近计算的动作期望' : '点击格子查看 Q 值' : model.cell(selected) === '#' ? '墙壁 · 不可进入' : model.cell(selected) === 'C' ? '跌落后返回起点' : '终止状态 · 未来价值为 0'}</small></div>
    <div className={styles.qValues}>{q.map((v, a) => <div key={a} className={valid && snap && snap.visits[selected] > 0 && snap.policy[selected] === a ? styles.bestQ : ''}><span>{ARROWS[a]} <small>{ACTION_NAMES[a]}</small></span><b>{valid ? v.toFixed(3) : '—'}</b></div>)}</div>
  </div>;
}
function Results({ exp, algorithm }: { exp: Experiment; algorithm: Algorithm }) {
  const s = exp.snapshot, dp = isPlanning(algorithm);
  return <aside className={styles.results} aria-label={`${LESSONS[algorithm].name} 训练结果`}>
    <div className={styles.sectionHeading}><h2>训练结果</h2><span>OUTPUT</span></div>
    <div className={styles.resultPrimary}><small>{dp ? '最大价值变化 Δ' : '当前 / 最近回合回报'}</small><strong data-testid="primary-result">{dp ? s?.delta.toFixed(6) ?? '0.000000' : (s?.episodeReturn ?? 0).toFixed(2)}</strong><span>{dp ? '扫描完成后更新' : `已完成 ${s?.episodes ?? 0} 回合 · 本回合 ${s?.episodeSteps ?? 0} 步`}</span></div>
    <LearningChart points={s?.history ?? []} planning={dp} />
    <div className={styles.metrics}><div><small>{dp ? 'Bellman 更新' : '环境步数'}</small><b data-testid="step-count">{(dp ? s?.updates : s?.steps)?.toLocaleString() ?? 0}</b></div><div><small>{dp ? '完整扫描' : '完成回合'}</small><b data-testid="episode-count">{(dp ? s?.sweeps : s?.episodes)?.toLocaleString() ?? 0}</b></div><div><small>{dp ? '策略改进' : '训练成功率'}</small><b>{dp ? s?.iterations ?? 0 : `${s?.episodes ? Math.round(s.successes / s.episodes * 100) : 0}%`}</b></div></div>
    <div className={styles.formulaBox}>
      <div className={styles.sectionHeading}><h3>当前更新</h3><span>UPDATE</span></div>
      <span className={styles.phase}>{PHASES[s?.phase ?? (dp ? 'value' : 'sample')]}</span>
      <p className={styles.formula}>{LESSONS[algorithm].formula}</p>
      <div className={styles.calculation} data-testid="update-formula">{s?.last?.formula ?? '单步后显示数值更新。'}</div>
      <p className={styles.detail}>{s?.last?.detail ?? '尚未执行更新。'}</p>
      {s?.last && <div className={styles.updateDelta}><span>目标 <b>{s.last.target.toFixed(3)}</b></span><span>变化 <b>{(s.last.newValue - s.last.oldValue).toFixed(3)}</b></span></div>}
    </div>
    {!dp && <p className={styles.footnote}>超时回合 {s?.truncations ?? 0} · 上限 500 步<br />曲线保留最近 300 回合，成功率按全部训练回合计算。</p>}
  </aside>;
}
function LessonPanel({ algorithm, snapshot }: { algorithm: Algorithm; snapshot: Snapshot | null }) {
  const l = LESSONS[algorithm];
  return <Accordion key={algorithm} type="single" collapsible className={styles.lessonAccordion}>
    <AccordionItem value="explanation"><AccordionTrigger className={styles.lessonTrigger}><span>算法说明 <small>{l.name}</small></span></AccordionTrigger>
    <AccordionContent transition={{ duration: 0.18, ease: 'easeOut' }}><section className={styles.lesson}>
    <div className={styles.lessonIntro}><span className={styles.eyebrow}>算法原理</span><h2>{l.name}<span>{l.zh}</span></h2><p>{l.description}</p><div className={styles.insight}><span>↳</span><p>{l.insight}</p></div></div>
    <div className={styles.code}><div className={styles.codeHeading}><span>算法如何运行</span><small>PSEUDOCODE</small></div><ol>{l.code.map((line, i) => <li key={i} className={snapshot?.last?.line === i ? styles.activeLine : ''}><span>{String(i + 1).padStart(2, '0')}</span><code>{line}</code>{snapshot?.last?.line === i && <i />}</li>)}</ol></div>
    <div className={styles.try}><h3>建议实验</h3><p>{l.experiment}</p></div>
  </section></AccordionContent></AccordionItem></Accordion>;
}

export default function Playground() {
  const [algorithmA, setAlgorithmA] = useState<Algorithm>('q-learning');
  const [algorithmB, setAlgorithmB] = useState<Algorithm>('sarsa');
  const [paramsA, setParamsA] = useState<Params>({ ...DEFAULT_PARAMS });
  const [paramsB, setParamsB] = useState<Params>({ ...DEFAULT_PARAMS });
  const [env, setEnv] = useState<EnvironmentConfig>(defaultEnv('grid'));
  const [seed, setSeed] = useState(42);
  const [compare, setCompare] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(30);
  const [heat, setHeat] = useState(true), [arrows, setArrows] = useState(true), [trace, setTrace] = useState(true);
  const [lessonSide, setLessonSide] = useState<'A' | 'B'>('A');
  const configA = useMemo(() => ({ algorithm: algorithmA, env, params: { ...paramsA, seed }, revision }), [algorithmA, env, paramsA, seed, revision]);
  const configB = useMemo(() => ({ algorithm: algorithmB, env, params: { ...paramsB, seed }, revision }), [algorithmB, env, paramsB, seed, revision]);
  const a = useExperiment(configA, true), b = useExperiment(configB, compare);
  const exps = compare ? [a, b] : [a];
  const running = exps.some(x => x.running);
  const ready = exps.every(x => x.snapshot !== null);
  const finished = exps.every(x => x.snapshot?.converged);
  const toggleRun = () => exps.forEach(x => x.send(running ? { type: 'pause' } : { type: 'run', speed }));
  const changeEnv = (id: EnvironmentId) => { setEnv(defaultEnv(id)); setSelected(new GridEnvironment(defaultEnv(id)).start); };
  const changeSpeed = (value: number) => { setSpeed(value); exps.forEach(x => x.send({ type: 'speed', speed: value })); };
  const reset = () => setRevision(r => r + 1);
  const slots: { side: 'A' | 'B'; exp: Experiment; algorithm: Algorithm; setAlgorithm: (a: Algorithm) => void; params: Params; setParams: (p: Params) => void }[] = [
    { side: 'A', exp: a, algorithm: algorithmA, setAlgorithm: setAlgorithmA, params: paramsA, setParams: setParamsA },
    ...(compare ? [{ side: 'B' as const, exp: b, algorithm: algorithmB, setAlgorithm: setAlgorithmB, params: paramsB, setParams: setParamsB }] : []),
  ];
  return <>
    <header className={styles.hero}>
      <div className={styles.headerTop}><a className={styles.brand} href="./" aria-label="RL Playground 首页"><h1>RL Playground</h1></a></div>
    </header>
    <section className={styles.toolbar} aria-label="实验控制">
      <div className={styles.playback}>
        <Button variant="ghost" className={styles.iconButton} aria-label="重置全部实验" title="重置全部实验" onClick={reset}><Icon name="reset" size={21} /></Button>
        <PlayButton running={running} disabled={!ready || finished} onClick={toggleRun} label={running ? '暂停全部实验' : '开始全部实验'} />
        <Button variant="ghost" className={styles.iconButton} aria-label="单步推进" title="单步推进" disabled={!ready || finished} onClick={() => exps.forEach(x => x.send({ type: 'step' }))}><Icon name="step" size={23} /></Button>
      </div>
      <div className={styles.counter}><span>{compare ? '实验 A 进度' : isPlanning(algorithmA) ? '扫描 / SWEEP' : '回合 / EPISODE'}</span><b data-testid="main-counter">{String(isPlanning(algorithmA) ? a.snapshot?.sweeps ?? 0 : a.snapshot?.episodes ?? 0).padStart(6, '0')}</b></div>
      <AlgorithmSelect value={algorithmA} onChange={setAlgorithmA} label={compare ? '算法 A' : '学习算法'} />
      {!compare && <Parameters algorithm={algorithmA} params={paramsA} onChange={setParamsA} />}
      <label className={`${styles.field} ${styles.speed}`}><span>演示速度</span><select aria-label="演示速度" value={speed} onChange={e => changeSpeed(Number(e.target.value))}><option value={2}>慢速 · 2 步/s</option><option value={10}>正常 · 10 步/s</option><option value={50}>快速 · 50 步/s</option><option value={1000}>极速 · 1000 步/s</option></select></label>
      <label className={styles.compareToggle}><Switch aria-label="双算法对比" checked={compare} onCheckedChange={value => { b.send({ type: 'pause' }); setCompare(value); setLessonSide('A'); }} /><span>双算法对比</span></label>
    </section>
    <main className={styles.main}>
      <div className={styles.labTop}><div><span className={styles.eyebrow}>实验</span></div><span className={styles.liveStatus}><i className={running ? styles.liveDot : ''} />{running ? exps.some(x => x.fast) ? '正在快速训练' : '实验进行中' : finished ? '规划已收敛' : '已暂停'}</span></div>
      {(a.error || b.error) && <div role="alert" className={styles.error}>{a.error || b.error}<Button variant="ghost" onClick={reset}>重新加载实验</Button></div>}
      <div className={`${styles.workspace} ${compare ? styles.compareWorkspace : ''}`}>
        <aside className={styles.environment}>
          <div className={styles.sectionHeading}><h2>环境</h2></div>
          <div className={styles.environments}>{(['grid', 'cliff', 'lake'] as EnvironmentId[]).map((id, i) => <Button variant="ghost" key={id} className={`${styles.envOption} ${env.id === id ? styles.envSelected : ''}`} aria-pressed={env.id === id} aria-label={`选择 ${ENV_NAMES[id]}`} onClick={() => changeEnv(id)}><div className={styles.mini}><MiniMap config={defaultEnv(id)} /></div><span><b>{ENV_NAMES[id]}</b><small>{id === 'grid' ? '迷宫寻路 · 6 × 6' : id === 'cliff' ? '悬崖行走 · 4 × 12' : '随机冰湖 · 4 × 4'}</small></span><em>{String(i + 1).padStart(2, '0')}</em></Button>)}</div>
          <p className={styles.envDescription}>{ENV_DESCRIPTIONS[env.id]}</p>
          <div className={styles.sideBlock}><h3>奖励配置</h3><NumericField label="每步奖励" value={env.stepReward} onChange={stepReward => setEnv({ ...env, stepReward })} /><NumericField label="抵达终点" value={env.goalReward} onChange={goalReward => setEnv({ ...env, goalReward })} /><NumericField label={env.id === 'cliff' ? '跌落悬崖' : env.id === 'lake' ? '落入冰洞' : '进入陷阱'} value={env.hazardReward} onChange={hazardReward => setEnv({ ...env, hazardReward })} /><NumericField label="撞墙 / 越界" value={env.wallReward} onChange={wallReward => setEnv({ ...env, wallReward })} /></div>
          <div className={styles.sideBlock}><label className={styles.rangeLabel}>动作偏移概率 <b>{Math.round(env.slip * 100)}%</b><input aria-label="动作偏移概率" type="range" min="0" max="1" step="0.01" value={env.slip} onChange={e => setEnv({ ...env, slip: Number(e.target.value) })} /></label><p className={styles.footnote}>偏移时等概率转向左侧或右侧。</p><NumericField label="随机种子" value={seed} onChange={setSeed} min={0} max={4294967295} step={1} /></div>
          <p className={styles.configHint}>调整实验参数会暂停并重新开始。<br />速度和显示选项可即时更改。</p>
        </aside>
        <div className={styles.experimentArea}>
          <div className={styles.experimentHeading}><div><h2>{compare ? '算法对比' : LESSONS[algorithmA].name}</h2></div><Button variant="ghost" className={styles.fastButton} disabled={!ready || finished} onClick={() => exps.forEach(x => x.send({ type: 'fast' }))}><Icon name="fast" /><span>快速训练 +100</span></Button></div>
          <p className={styles.fastHint}>{compare ? '采样算法 +100 回合 · 规划算法 +100 扫描或至收敛' : isPlanning(algorithmA) ? '快速训练将执行 100 次完整扫描，收敛后自动停止。' : '快速训练将完成 100 个回合，包括超时回合。'}</p>
          <div className={styles.slots}>{slots.map(({ side, exp, algorithm, setAlgorithm, params, setParams }) => <section className={styles.slot} key={side} aria-label={`实验 ${side}`}>
            {compare && <div className={styles.slotHeader}><span className={styles.slotBadge}>{side}</span><AlgorithmSelect value={algorithm} onChange={setAlgorithm} label={`实验 ${side} 算法`} /><PlayButton small running={exp.running} disabled={!exp.snapshot || !!exp.snapshot?.converged} label={`${exp.running ? '暂停' : '开始'}实验 ${side}`} onClick={() => exp.send(exp.running ? { type: 'pause' } : { type: 'run', speed })} /><Parameters algorithm={algorithm} params={params} onChange={setParams} prefix={`${side} `} /></div>}
            <div className={styles.mapHeading}><span>{ENV_NAMES[env.id]} <small>{isPlanning(algorithm) ? '· 价值传播' : '· 智能体轨迹'}</small></span><span className={styles.phase}>{PHASES[exp.snapshot?.phase ?? 'sample']}</span></div>
            <Board key={JSON.stringify(side === 'A' ? configA : configB)} running={exp.running} fast={exp.fast} speed={speed} config={env} snap={exp.snapshot} selected={selected} select={setSelected} heat={heat} arrows={arrows} trace={trace} />
            <StateInspector snap={exp.snapshot} env={env} selected={selected} />
            {compare && <Results exp={exp} algorithm={algorithm} />}
          </section>)}</div>
          <div className={styles.viewControls}><label><Switch aria-label="价值热力图" checked={heat} onCheckedChange={setHeat} />价值热力图</label><label><Switch aria-label="策略箭头" checked={arrows} onCheckedChange={setArrows} />策略箭头</label><label><Switch aria-label="行动轨迹" checked={trace} onCheckedChange={setTrace} />行动轨迹</label><span><i />智能体 <b>G</b>终点</span></div>
        </div>
        {!compare && <Results exp={a} algorithm={algorithmA} />}
      </div>
      <section className={styles.evaluation} aria-label="统一策略评估">
        <div className={styles.evalIntro}><h2>策略评估</h2><p>关闭探索与学习 · 相同的 100 组种子 · 每回合最多 500 步</p></div>
        <Button variant="ghost" className={styles.evaluateButton} disabled={!ready} onClick={() => exps.forEach(x => x.send({ type: 'evaluate' }))}>评估策略 <Icon name="arrow" /></Button>
        <div className={styles.evalTable}><table><thead><tr><th>策略</th><th>平均回报</th><th>成功率</th><th>成功平均步数</th><th>超时 / 失败</th></tr></thead><tbody>{slots.map(({ side, exp, algorithm }) => <tr key={side}><th>{compare && <span className={styles.tableBadge}>{side}</span>}{LESSONS[algorithm].name}</th><td>{exp.evaluation?.meanReturn.toFixed(2) ?? '—'}</td><td className={styles.successRate}>{exp.evaluation ? `${(exp.evaluation.successRate * 100).toFixed(0)}%` : '—'}</td><td>{exp.evaluation?.meanSuccessSteps?.toFixed(1) ?? '—'}</td><td>{exp.evaluation ? `${exp.evaluation.timeouts} / ${exp.evaluation.failures}` : '—'}</td></tr>)}</tbody></table></div>
        <p className={styles.evalNote}>评估会暂停训练，不改变已学价值。{compare ? '不同算法的训练量分开标注，评估只比较当前策略表现。' : '继续训练后，旧评估自动清除。'} 未成功时平均步数显示为 —。</p>
      </section>
      {compare ? <Tabs value={lessonSide} onValueChange={value => setLessonSide(value as 'A' | 'B')} className={styles.lessonTabs}>
        <TabsList aria-label="教学算法选择"><TabsTrigger value="A">算法 A · {LESSONS[algorithmA].name}</TabsTrigger><TabsTrigger value="B">算法 B · {LESSONS[algorithmB].name}</TabsTrigger></TabsList>
        <TabsContent value="A" transition={{ duration: 0.15 }}><LessonPanel algorithm={algorithmA} snapshot={a.snapshot} /></TabsContent>
        <TabsContent value="B" transition={{ duration: 0.15 }}><LessonPanel algorithm={algorithmB} snapshot={b.snapshot} /></TabsContent>
      </Tabs> : <LessonPanel algorithm={algorithmA} snapshot={a.snapshot} />}
    </main>
    <footer className={styles.footer}><span>RL Playground</span><div><a href="https://github.com/tensorflow/playground" target="_blank" rel="noreferrer">设计灵感 ↗</a><a href="http://incompleteideas.net/book/the-book-2nd.html" target="_blank" rel="noreferrer">Sutton & Barto · RL 教材 ↗</a><span>浏览器本地计算 · 六种经典算法</span></div></footer>
  </>;
}
