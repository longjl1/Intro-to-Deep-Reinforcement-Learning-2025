'use client';
import { line, scaleLinear, area } from 'd3';
import { ARROWS, GridEnvironment, isPlanning, type Snapshot, type EnvironmentConfig, type Point } from '../lib/rl';
import styles from './Playground.module.css';

export function Icon({ name, size = 18 }: { name: 'play' | 'pause' | 'step' | 'reset' | 'fast' | 'compare' | 'arrow' | 'check'; size?: number }) {
  const paths = { play: 'M8 5l11 7-11 7Z', pause: 'M8 5v14M16 5v14', step: 'M5 5l10 7-10 7ZM19 5v14', reset: 'M4 9a8 8 0 1 1 0 6M4 3v6h6', fast: 'M3 6l8 6-8 6ZM12 6l8 6-8 6Z', compare: 'M4 5h6v14H4ZM14 5h6v14h-6Z', arrow: 'M5 12h14m-5-5 5 5-5 5', check: 'm5 12 4 4L19 6' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function MiniMap({ config }: { config: EnvironmentConfig }) {
  const env = new GridEnvironment(config);
  return <svg viewBox={`0 0 ${env.cols * 10} ${env.rows * 10}`} aria-hidden="true">{env.layout.join('').split('').map((c, s) => <rect key={s} x={(s % env.cols) * 10 + 1} y={Math.floor(s / env.cols) * 10 + 1} width="8" height="8" rx="1" fill={c === '#' ? '#6b7d86' : c === 'G' ? '#4a8caf' : c === 'S' ? '#203e50' : ['T', 'H', 'C'].includes(c) ? '#dfa264' : '#e1e7e9'} />)}</svg>;
}
export function Board({ config, snap, selected, select, heat, arrows, trace }: { config: EnvironmentConfig; snap: Snapshot | null; selected: number; select: (s: number) => void; heat: boolean; arrows: boolean; trace: boolean }) {
  const env = new GridEnvironment(config);
  const cell = 60;
  const padding = 26;
  const values = snap?.values ?? Array(env.size).fill(0);
  const domain = Math.max(1, ...values.map(v => Math.abs(v)));
  const color = scaleLinear<string>().domain([-domain, 0, domain]).range(['#cf8949', '#f1f3f2', '#438ab3']);
  const active = new Set(env.active);
  const center = (s: number): [number, number] => [(s % env.cols) * cell + padding + cell / 2, Math.floor(s / env.cols) * cell + padding + cell / 2];
  const agent = snap?.state ?? env.start;
  const planning = snap ? isPlanning(snap.algorithm) : false;
  const path = line<number>().x(s => center(s)[0]).y(s => center(s)[1])(snap?.trace ?? []);
  return <div className={styles.boardWrap}>
    <svg className={styles.board} viewBox={`0 0 ${env.cols * cell + padding * 2} ${env.rows * cell + padding * 2}`} role="group" aria-label={`${config.id} 价值与策略地图`}>
      {Array.from({ length: env.cols }, (_, col) => <text key={`c${col}`} x={padding + col * cell + 30} y="14" textAnchor="middle" className={styles.axisText}>{col + 1}</text>)}
      {Array.from({ length: env.rows }, (_, row) => <text key={`r${row}`} x="10" y={padding + row * cell + 35} textAnchor="middle" className={styles.axisText}>{row + 1}</text>)}
      {env.layout.join('').split('').map((c, s) => {
        const x = (s % env.cols) * cell + padding, y = Math.floor(s / env.cols) * cell + padding;
        const obstacle = c === '#', hazard = ['C', 'H', 'T'].includes(c);
        const label = c === 'S' ? '起点' : c === 'G' ? '终点' : c === 'C' ? '悬崖' : c === 'H' ? '冰洞' : c === 'T' ? '陷阱' : '';
        return <g key={s} role="button" tabIndex={0} aria-pressed={selected === s} aria-label={`格子 ${Math.floor(s / env.cols) + 1},${s % env.cols + 1} ${label || (obstacle ? '墙壁' : '普通')}，价值 ${values[s].toFixed(3)}`} onClick={() => select(s)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s); } }} className={styles.cell}>
          <rect x={x + 2} y={y + 2} width={56} height={56} rx="3" fill={obstacle ? '#84949b' : hazard ? '#f1d9c2' : c === 'G' ? '#c5dde8' : heat ? color(values[s]) : '#edf0f0'} stroke={selected === s ? '#203e50' : '#fff'} strokeWidth={selected === s ? 2 : 1} />
          {obstacle && <path d={`M${x + 12} ${y + 18}h36m-36 12h36m-36 12h36`} stroke="#ffffff50" strokeWidth="2" />}
          {hazard && <path d={`m${x + 25} ${y + 18} 10 10m0-10-10 10`} stroke="#b37942" strokeWidth="2" />}
          {c === 'G' && <path d={`M${x + 25} ${y + 31}V${y + 13}l14 5-14 5`} fill="#367d9f" stroke="#367d9f" strokeWidth="2" />}
          {arrows && active.has(s) && snap && snap.visits[s] > 0 && <text x={x + 30} y={y + 29} textAnchor="middle" fill="#254b60" fontSize="24">{ARROWS[snap.policy[s]]}</text>}
          {label ? <text x={x + 30} y={y + 48} textAnchor="middle" className={styles.cellLabel}>{label}</text> : !obstacle && <text x={x + 30} y={y + 49} textAnchor="middle" className={styles.cellValue}>{values[s].toFixed(2)}</text>}
        </g>;
      })}
      {trace && !planning && path && <path d={path} fill="none" stroke="#d98940" strokeWidth="2.5" strokeDasharray="4 5" opacity=".7" pointerEvents="none" />}
      <g transform={`translate(${center(agent).join(',')})`} pointerEvents="none">
        {planning ? <rect x="-24" y="-24" width="48" height="48" rx="2" fill="none" stroke="#d18537" strokeWidth="2" strokeDasharray="5 3" /> : <><circle r="12" fill="#244657" stroke="#fff" strokeWidth="3" /><circle cx="-3" cy="-2" r="1.4" fill="white" /><circle cx="4" cy="-2" r="1.4" fill="white" /><path d="M-3 4h7" stroke="white" strokeWidth="1.4" /></>}
      </g>
    </svg>
    <div className={styles.scale}><span>−{domain.toFixed(1)}</span><i /><span>+{domain.toFixed(1)}</span><small>状态价值 V(s)</small></div>
  </div>;
}
export function LearningChart({ points, planning }: { points: Point[]; planning: boolean }) {
  const width = 330, height = 155, left = 42, right = 12, top = 15, bottom = 27;
  const low = Math.min(0, ...points.map(p => p.y)), high = Math.max(0, ...points.map(p => p.y));
  const x = scaleLinear().domain([points[0]?.x ?? 0, Math.max((points[0]?.x ?? 0) + 1, points.at(-1)?.x ?? 100)]).range([left, width - right]);
  const y = scaleLinear().domain(low === high ? [-1, 1] : [low, high]).nice(3).range([height - bottom, top]);
  const curve = line<Point>().x(p => x(p.x)).y(p => y(p.y));
  // Only complete windows are shown; no partial window is invented at the clipped boundary.
  const mean = planning ? [] : points.slice(19).map((p, i) => ({ x: p.x, y: points.slice(i, i + 20).reduce((sum, q) => sum + q.y, 0) / 20 }));
  return <div className={styles.chart}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={planning ? '每次扫描的最大价值变化曲线' : '回合回报与二十回合移动平均曲线'}>
      {y.ticks(3).map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#dce3e6" strokeDasharray="2 3" /><text x={left - 7} y={y(tick) + 3} textAnchor="end" className={styles.axisText}>{Math.abs(tick) >= 1000 ? `${(tick / 1000).toFixed(0)}k` : Number(tick.toPrecision(3))}</text></g>)}
      {points.length > 1 && <><path d={area<Point>().x(p => x(p.x)).y0(height - bottom).y1(p => y(p.y))(points) ?? ''} fill="#3a89b00d" /><path d={curve(points) ?? ''} fill="none" stroke={planning ? '#377fa4' : '#aec7d5'} strokeWidth="1.5" />{mean.length > 1 && <path d={curve(mean) ?? ''} fill="none" stroke="#2d799f" strokeWidth="2.2" />}</>}
      {points.length === 1 && <circle cx={x(points[0].x)} cy={y(points[0].y)} r="3" fill="#377fa4" />}
      {!points.length && <text x="182" y="73" textAnchor="middle" fill="#8d9ba2" fontSize="11">{planning ? '开始扫描，观察价值收敛' : '完成第一个回合后，曲线将在这里生长'}</text>}
      <text x={left} y={height - 7} className={styles.axisText}>{points[0]?.x ?? 0}</text><text x={width - right} y={height - 7} textAnchor="end" className={styles.axisText}>{points.at(-1)?.x ?? 100}</text>
    </svg>
    <div className={styles.chartLegend}><span><i />{planning ? '最大变化 Δ' : '回合回报'}</span>{!planning && <span><i />20 回合均值</span>}<small>{planning ? '扫描次数 →' : '回合 →'}</small></div>
  </div>;
}
