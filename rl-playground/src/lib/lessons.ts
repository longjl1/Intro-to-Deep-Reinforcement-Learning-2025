import type { Algorithm } from './rl';
export interface Lesson { name: string; zh: string; tag: string; subtitle: string; formula: string; description: string; code: string[]; insight: string; experiment: string }
export const LESSONS: Record<Algorithm, Lesson> = {
  'q-learning': {
    name: 'Q-learning', zh: 'Q 学习', tag: 'OFF-POLICY · TD', subtitle: '从每一次尝试中，学会更好的选择。',
    formula: 'Q(s,a) ← Q(s,a) + α [r + γ maxₐ′ Q(s′,a′) − Q(s,a)]',
    description: '智能体用 ε-greedy 探索环境，却用下一状态的最大 Q 值作为学习目标。行为可以带有探索，学习目标仍指向贪心策略。',
    code: ['用 ε-greedy 选择动作 a', '执行 a，观察奖励 r 和下一状态 s′', 'Q(s,a) ← Q(s,a) + α[r + γ max Q(s′,·) − Q(s,a)]', 's ← s′；终止或截断后开始新回合'],
    insight: '它关心“下一步最好能得到多少”，而不要求下一步真的采取最优动作。',
    experiment: '切换到 Cliff Walking，与 SARSA 并排训练。保持 ε > 0，观察靠近悬崖的捷径与更安全的绕行。单次训练结果会受随机种子影响。',
  },
  sarsa: {
    name: 'SARSA', zh: '同策略时序差分', tag: 'ON-POLICY · TD', subtitle: '学习自己真正会采取的行动。',
    formula: 'Q(s,a) ← Q(s,a) + α [r + γ Q(s′,a′) − Q(s,a)]',
    description: 'SARSA 用连续的状态、动作、奖励、下一状态与下一动作更新 Q 值。下一动作由当前 ε-greedy 策略抽取，并在下一步实际执行。',
    code: ['用 ε-greedy 选择动作 a', '执行 a，观察 r、s′；再用 ε-greedy 选择 a′', 'Q(s,a) ← Q(s,a) + α[r + γ Q(s′,a′) − Q(s,a)]', '(s,a) ← (s′,a′)；终止或截断后重置'],
    insight: '探索产生的风险也被计入学习目标；ε 越大，随机行动的影响越明显。',
    experiment: '在 Cliff Walking 增大 ε，再与 Q-learning 比较训练回报。随后评估贪心策略，区分“训练中的表现”和“关闭探索后的表现”。',
  },
  'expected-sarsa': {
    name: 'Expected SARSA', zh: '期望 SARSA', tag: 'ON-POLICY · EXPECTED TD', subtitle: '把下一步的所有可能，都算进来。',
    formula: 'Q(s,a) ← Q(s,a) + α [r + γ Σₐ′ π(a′|s′)Q(s′,a′) − Q(s,a)]',
    description: '对下一状态的所有动作按 ε-greedy 概率加权。相比 SARSA，它消除了学习目标中对下一动作抽样带来的方差；环境随机性仍然存在。',
    code: ['用 ε-greedy 选择动作 a', '执行 a，观察 r、s′；计算 π(·|s′)', 'Q(s,a) ← Q(s,a) + α[r + γ Σ π(a′|s′)Q(s′,a′) − Q(s,a)]', 's ← s′；继续采样'],
    insight: '若多个动作并列最优，利用部分的概率均分给它们，探索部分均分给全部动作。',
    experiment: '在 FrozenLake 对比 SARSA 和 Expected SARSA，使用相同 α、γ、ε，观察回报的波动。',
  },
  mc: {
    name: 'Monte Carlo', zh: '首次访问蒙特卡洛控制', tag: 'ON-POLICY · EPISODIC', subtitle: '走完一段旅程，再回头理解每一步。',
    formula: 'Gₜ = Σₖ γᵏrₜ₊ₖ₊₁；Q(s,a) ← Q(s,a) + [Gₜ − Q(s,a)] / N(s,a)',
    description: '先完成整个回合，再计算每一步的折扣回报。每个状态动作对在该回合只取第一次访问，以跨回合样本均值估计 Q，并持续采用 ε-greedy 策略探索。',
    code: ['以 ε-greedy 策略开始一个回合', '保存每次 (s,a,r)，直到真正终止', '从回合末尾向前计算折扣回报 G', '对首次访问的 (s,a)：N += 1；Q += (G − Q) / N'],
    insight: '无需 bootstrap，也不使用 α；代价是必须等到完整回合结束。超时回合被丢弃，单独计数。',
    experiment: '在 Gridworld 单步观察：移动时 Q 不变，抵达终点或陷阱后逐项更新。再与 Q-learning 的即时更新比较。',
  },
  vi: {
    name: 'Value Iteration', zh: '价值迭代', tag: 'MODEL-BASED · PLANNING', subtitle: '让终点的价值，一圈一圈传播出去。',
    formula: 'V(s) ← maxₐ Σₛ′ P(s′|s,a) [r + γV(s′)]',
    description: '已知环境转移概率与奖励模型，对每个状态进行 Bellman 最优更新。一次扫描使用上一轮的价值，逐格显示新值，直到最大变化 Δ 小于 10⁻⁶。',
    code: ['保存上一轮价值 V_old', '逐状态：V(s) ← maxₐ Σ P(s′|s,a)[r + γV_old(s′)]', '记录 Δ = max |V − V_old|；提取贪心策略', '若 Δ < 10⁻⁶ 则结束，否则开始下一扫描'],
    insight: '它通过模型做规划，不需要智能体收集真实回合。扫描次数不能直接等同于采样算法的训练回合。',
    experiment: '在 Gridworld 点击单步，看终点附近先出现正价值。增大 γ，观察远处状态如何更重视未来奖励。',
  },
  pi: {
    name: 'Policy Iteration', zh: '策略迭代', tag: 'MODEL-BASED · PLANNING', subtitle: '先理解当前策略，再让它更好一点。',
    formula: '评估：V ← TπV；改进：π(s) ← argmaxₐ Σ P(s′|s,a)[r + γV(s′)]',
    description: '从一个确定策略开始，反复执行策略评估与策略改进。评估扫描直到 Δ < 10⁻⁶，再逐格选择更好的动作，直到策略不再变化。',
    code: ['初始化策略 π；保存上一轮 V', '评估：V(s) ← Σ P(s′|s,π(s))[r + γV_old(s′)]', '重复评估扫描，直到 Δ < 10⁻⁶', '改进每个状态的 π；策略稳定则结束，否则回到评估'],
    insight: '并列最优时保留原动作，避免策略在等价动作之间反复切换。',
    experiment: '与 Value Iteration 对比，观察策略评估和改进的阶段切换；收敛后两者的价值应接近，最优路径可能不唯一。',
  },
};
export const ALGORITHM_ORDER: Algorithm[] = ['q-learning', 'sarsa', 'expected-sarsa', 'mc', 'vi', 'pi'];
export const PHASES: Record<string, string> = { sample: '与环境交互', 'mc-update': '回合回报更新', value: 'Bellman 最优更新', evaluate: '策略评估', improve: '策略改进', converged: '已收敛' };
