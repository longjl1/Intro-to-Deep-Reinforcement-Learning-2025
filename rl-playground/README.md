# RL Playground · 强化学习交互实验台

一个独立的 Next.js 教学应用：在浏览器里观察六种经典强化学习算法，单步展开真实数值更新，并在同一环境中对比两个算法。无需 Python、模型服务或外部 API。

**在线演示：[RL Playground](https://longjl1.github.io/Intro-to-Deep-Reinforcement-Learning-2025/)**

## GitHub Pages 部署

仓库根目录的 `.github/workflows/rl-playground-pages.yml` 会在 `main` 上的应用或工作流发生变化时自动执行安装、测试、类型检查、静态构建和 Pages 部署。Pull Request 只做验证；也可在 GitHub Actions 中手动运行工作流。

GitHub Settings → Pages 的发布来源使用 **GitHub Actions**。构建通过 `actions/configure-pages` 获取站点子路径并传入 `NEXT_PUBLIC_BASE_PATH`，Next.js 会为页面资源与 Worker 生成正确地址。本地不设置该变量，仍然使用 `/`。

手工复现 GitHub Pages 构建：

```bash
NEXT_PUBLIC_BASE_PATH=/Intro-to-Deep-Reinforcement-Learning-2025 npm run build
```

该构建必须在对应子路径下提供服务；恢复普通本地预览前，重新运行不带该变量的 `npm run build`。

## 本地启动

需要 Node.js 20.9+（本项目使用 Node.js 24 验证）与 npm。

```bash
cd rl-playground
npm ci
npm run dev
```

打开 <http://localhost:3000>。开发和生产构建显式使用 webpack，以统一 TypeScript Web Worker 的打包方式。

```bash
npm test              # 数值、收敛、模型一致性与调度隔离测试
npm run typecheck     # TypeScript 检查
npm run build         # 静态导出到 out/
npm run preview       # 在 3000 端口预览静态生产构建
```

`out/` 可以部署在支持静态文件的站点根目录。预览时需要 HTTP 服务，不能双击 HTML 使用 `file://` 打开 Worker。应用不需要服务器 API；依赖和资源均本地打包，不依赖外部字体或 CDN。

## 怎么使用

1. 默认 **Q-learning + Gridworld**，按「单步」观察智能体、Q 值与具体公式。
2. 按播放持续学习，或者「快速训练 +100」。采样算法增加 100 个回合，动态规划增加最多 100 个完整扫描，收敛后提前停止。
3. 点击地图格子查看四个动作的价值。开启／关闭热力图、策略箭头和轨迹。
4. 开启「双算法对比」，A、B 分别选择算法和参数；顶部共同控制运行，两侧按钮可独立暂停。
5. 展开「算法说明」查看中文解释、实时伪代码高亮和建议实验。
6. 「评估策略」会暂停训练，使用相同的 100 组评估种子，关闭探索与学习，显示平均回报、成功率、成功回合平均步数以及超时／失败数量。

数值框在失去焦点或按 Enter 时应用。环境、种子变化重置两侧；算法和学习参数变化重置对应侧。速度与显示选项即时生效。重置按钮将两侧按当前参数重新初始化。

## 六种算法

| 算法 | 实现与推进单位 |
| --- | --- |
| Value Iteration | 同步 Bellman 最优更新；每步更新一个状态；完整扫描使用上一轮价值 |
| Policy Iteration | 初始确定性向上策略；逐状态迭代评估，然后逐状态策略改进；并列最优保留原动作 |
| Monte Carlo Control | ε-soft on-policy first-visit 控制；完整回合结束后计算折扣回报，逐项执行样本均值更新 |
| SARSA | 下一动作按 ε-greedy 抽样，更新后在下一步实际执行 |
| Q-learning | 使用下一状态最大 Q 值作为目标 |
| Expected SARSA | 使用 ε-greedy 策略下的动作价值期望作为目标 |

α、γ、ε 默认分别为 0.2、0.95、0.15，随机种子 42。Monte Carlo 使用累计样本均值，不使用 α。动态规划使用已知转移模型，不使用 α、ε。γ 限制在 `[0, 0.999]`，评估扫描的收敛阈值为 `1e-6`。

ε-greedy 会将探索概率均分给所有动作，将利用概率均分给所有并列最优动作。地图箭头仅显示一个代表性的最优方向；采样算法的贪心评估在并列动作中随机选择。动态规划评估执行其当前确定策略。

## 环境语义

| 环境 | 大小 | 每步 | 撞墙 | 终点 | 危险 | 默认偏移 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Gridworld | 6×6 | -0.04 | -0.25 | +10 | -10，终止 | 0 |
| Cliff Walking | 4×12 | -1 | -1 | -1 | -100，返回起点并继续 | 0 |
| FrozenLake | 4×4 | 0 | 0 | +1 | 0，终止 | 2/3 |

所有奖励均为本次转移的奖励，而不是另加在每步奖励上。动作偏移概率为 `p` 时，预期方向概率为 `1-p`，左、右方向各为 `p/2`。默认 FrozenLake 的三个方向各约 1/3；UI 将百分比四舍五入显示为 67%。

Gridworld 保留原有迷宫的地图与默认奖励，新应用的回合上限统一为 500 步。Cliff Walking 到达悬崖会回到起点而不终止，FrozenLake 冰洞和 Gridworld 陷阱会真正终止。

**终止与截断不同**：真正终止的 TD 目标不含未来价值；达到 500 步的截断继续保留 bootstrap，但下一步重开环境。Monte Carlo 丢弃截断回合的学习样本，并将该回合计入回报曲线和超时数。高探索率或稀疏奖励环境中，Monte Carlo 可能学习缓慢。

## 统计与比较

- 曲线最多保留最近 300 个回合／扫描；20 回合移动平均只显示完整窗口，避免在截取边缘产生虚假的短窗口。
- 训练成功率以所有已完成回合为分母，包括超时回合。训练回报是未折扣的奖励总和；MC 学习使用折扣回报，两者含义不同。
- 动态规划显示价值变化 Δ、扫描次数、模型更新次数；采样算法显示环境步数与回合。一次策略改进完成后计为一个策略迭代。
- 两侧评估分别使用种子 `2026 + i × 9973`，`i=0…99`。评估拥有独立随机流，既不修改价值，也不消耗训练随机数。评估最多 500 步；无成功回合时平均成功步数显示为 `—`。
- 同一 seed 便于复现，不代表不同算法会经历同样的训练轨迹。不同训练工作量不直接等价；本应用演示当前策略表现，不输出算法优劣的统计显著性结论。

## 代码结构

```text
src/
  app/                  # Next.js 页面、静态导出入口与全局样式
  components/           # React 实验台、SVG 地图、D3 曲线与 Worker hook
  lib/rl.ts             # 转移模型、六算法、快照、策略评估
  lib/runner.ts         # 可测试的调度器、暂停与命令序号隔离
  lib/lessons.ts        # 中文解释、伪代码与操作实验
  workers/              # 浏览器训练线程
tests/                  # 算法与调度测试
```

每侧独立 Worker、环境与随机数生成器。快速训练每批执行最多 1,000 次推进或 8ms 后交还事件循环，批次间等待 16ms。修改配置直接终止旧 Worker；命令序号忽略晚到的旧快照。测试用可控调度器验证取消后的回调不能继续推进。

## 参考与归属

- [TensorFlow Playground](https://github.com/tensorflow/playground)：界面布局和蓝橙价值映射的设计灵感。本项目自主实现 Next.js / React 界面，没有复制原仓库实现或商标。
- [Sutton & Barto, Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book-2nd.html)：第 4–6 章的动态规划、Monte Carlo 与 TD 方法。
- [Gymnasium Cliff Walking](https://gymnasium.farama.org/environments/toy_text/cliff_walking/) 与 [FrozenLake](https://gymnasium.farama.org/environments/toy_text/frozen_lake/)：预设环境语义参考。
- [Animate UI](https://animate-ui.com/)：按钮、Radix 开关、标签页、折叠面板和提示组件按官方 registry 导入。完整来源见 `src/components/animate-ui/SOURCES.json`，许可证见同目录 `LICENSE.md`。当前官方许可证为 MIT + Commons Clause，允许用于应用和网站，限制单独销售或分发原始组件集合。
- 本地适配：移除按钮、开关和标签页装饰阴影，减小按钮缩放幅度，并修正 Switch 将 Radix 专用状态回调传给 DOM 的控制台警告。
- [Motion](https://motion.dev/)：SVG Agent 的格子位移与轻微缩放弹跳。动画只读取快照；回合重启、悬崖返回、高速批次和重置直接定位，暂停会停止并定位到最新快照。
- [Open Sans](https://fontsource.org/fonts/open-sans) 与 [Noto Sans SC](https://fontsource.org/fonts/noto-sans-sc)：通过 Fontsource 本地打包 400／500／600 字重，中文按 `unicode-range` 分片请求，不依赖 Google Fonts 或 CDN；字体采用 OFL-1.1。
- 全站纯黑背景，黑白灰控件；地图和曲线保留蓝橙功能色。遵循 `prefers-reduced-motion`，关闭 Agent 位移和弹跳。

范围限定为浏览器内经典算法教学，支持本地运行与 GitHub Pages 静态发布。当前版本不包含地图编辑、Bandit、深度强化学习、用户账户或实验持久化；旧迷宫演示与 notebooks 保持独立。
