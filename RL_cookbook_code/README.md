# Reinforcement Learning Cookbook

This directory is a compact, notebook-first companion to Chapters 2-10 of Sutton and Barto's *Reinforcement Learning: An Introduction*. The 67 notebooks emphasize readable equations, small experiments, and direct implementations.

## Chapter Guide

| Chapter | Topic | Notebooks | Guide |
| --- | --- | ---: | --- |
| 2 | Multi-armed bandits | 3 | [`chapter2/`](chapter2/) |
| 3 | Finite Markov decision processes | 11 | [`chapter3/`](chapter3/) |
| 4 | Dynamic programming | 12 | [`chapter4/`](chapter4/) |
| 5 | Monte Carlo methods | 13 | [`chapter5/`](chapter5/) |
| 6 | Temporal-difference learning | 6 | [`chapter6/`](chapter6/) |
| 7 | n-step bootstrapping | 5 | [`chapter7/`](chapter7/) |
| 8 | Planning and learning with tabular methods | 3 | [`chapter8/`](chapter8/) |
| 9 | On-policy prediction with approximation | 7 | [`chapter9/`](chapter9/) |
| 10 | On-policy control with approximation | 7 | [`chapter10/`](chapter10/) |

Each chapter README lists the recommended notebook order. Start with the `00_..._overview.ipynb` notebook where one is available, then follow the numbered sequence.

## Running the Notebooks

From the repository root:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab RL_cookbook_code
```

The cookbook itself uses NumPy and Matplotlib. Gymnasium is included in the base requirements for the coursework notebooks elsewhere in the repository.

## Design Principles

- Keep each notebook self-contained.
- Show update rules close to the code that implements them.
- Prefer small, inspectable experiments over framework-heavy abstractions.
- Treat saved plots as illustrations rather than exact benchmark reproductions.
