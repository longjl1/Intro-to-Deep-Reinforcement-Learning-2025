# Reinforcement Learning: From Bandits to Function Approximation

A notebook-first learning repository for classical reinforcement learning, built around Sutton and Barto's *Reinforcement Learning: An Introduction* and course assignments completed in 2025.

The repository contains **74 Jupyter notebooks**: a structured chapter-by-chapter cookbook, three course projects, and an experimental deep-RL workspace.

## Start Here

The fastest route through the material is the [`RL_cookbook_code/`](RL_cookbook_code/) collection. Its notebooks are small, self-contained, and arranged in conceptual order.

| Path | Topics | Best for |
| --- | --- | --- |
| [`RL_cookbook_code/`](RL_cookbook_code/) | Bandits, MDPs, DP, Monte Carlo, TD, n-step methods, planning, approximation | A guided textbook review |
| [`K-armed Bandit problem/`](K-armed%20Bandit%20problem/) | Epsilon-greedy, softmax, UCB | Comparing exploration strategies |
| [`Racetrack problem/`](Racetrack%20problem/) | Monte Carlo control | A larger tabular control problem |
| [`Hw3/`](Hw3/) | FrozenLake, Q-learning, environment stochasticity | Gymnasium-based experimentation |
| [`final/`](final/) | DQN for discrete-action CarRacing | Experimental deep RL |

## Quick Start

Python 3.12 is recommended because it matches the notebook metadata.

```bash
git clone https://github.com/longjl1/Intro-to-Deep-Reinforcement-Learning-2025.git
cd Intro-to-Deep-Reinforcement-Learning-2025

python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
jupyter lab
```

The base environment covers the cookbook and the first three assignments. The CarRacing DQN notebooks need the optional deep-learning stack:

```bash
pip install -r requirements-final.txt
```

On macOS, Gymnasium's Box2D extra may require SWIG to be installed first (`brew install swig`).

## Suggested Learning Paths

### Compact foundations

`Chapter 2 -> Chapter 3 -> Chapter 4 -> Chapter 5 -> Chapter 6`

This route moves from action selection to finite MDPs, planning, model-free prediction, and control.

### Coursework route

`K-armed Bandit -> Racetrack -> FrozenLake -> CarRacing DQN`

This route follows the assignments from small stochastic problems to function approximation with a convolutional Q-network.

### Approximation route

`Chapter 6 -> Chapter 7 -> Chapter 9 -> Chapter 10 -> final/`

This route focuses on bootstrapping, multi-step targets, state aggregation, tile coding, and deep value approximation.

## Repository Layout

```text
.
├── RL_cookbook_code/       # 67 notebooks covering textbook Chapters 2-10
├── K-armed Bandit problem/ # Homework 1 notebooks, report, and figures
├── Racetrack problem/      # Monte Carlo control notebook, report, and figures
├── Hw3/                    # FrozenLake notebook, report, and figures
├── final/                  # Experimental CarRacing DQN notebooks
├── scripts/                # Dependency-free repository checks
├── requirements.txt        # Base notebook environment
└── requirements-final.txt  # Optional CarRacing/PyTorch environment
```

## Reproducibility Notes

- Most notebooks are intentionally self-contained; some helper code is repeated to keep each topic readable in isolation.
- Randomized experiments may not reproduce saved figures exactly unless the notebook sets a seed.
- Some course experiments are computationally expensive. Before running an entire notebook, check its trial, episode, and time-step constants.
- Generated images and PDFs are retained as course artifacts. `Hw3.zip` is kept as the original submission archive.
- Run the `final/` notebooks from that directory so model checkpoints are written to `final/models/`.

## Quality Check

The repository includes a dependency-free validator for notebook JSON, Python syntax, kernel metadata, and saved error outputs:

```bash
python scripts/validate_notebooks.py
```

This is a structural check, not a full execution of every experiment. Full notebook execution is intentionally manual because several notebooks contain long training runs.

## Scope

This is an educational and experimental repository, not an installable reinforcement-learning library or benchmark suite. The implementations prioritize readable update rules and small numerical examples over framework abstractions and production APIs.

## License

Released under the [MIT License](LICENSE).
