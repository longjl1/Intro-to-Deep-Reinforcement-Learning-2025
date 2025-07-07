# Chapter 2: The 10-Armed Testbed

This folder contains a compact, notebook-first walkthrough of key ideas from **Chapter 2** of Sutton and Barto's *Reinforcement Learning: An Introduction*.

The goal is not to reproduce every figure from the book exactly. Instead, these notebooks provide:

- minimal implementations
- short theory explanations in Markdown
- small experiments that are easy to rerun and modify
- clean enough structure for study notes or GitHub portfolio use

## Notebook Guide

### 1. Incremental updates and nonstationarity
- [01_incremental_and_nonstationary.ipynb](./01_incremental_and_nonstationary.ipynb)
- Covers Section 2.4 and Section 2.5
- Topics:
  - incremental sample-average action-value estimation
  - constant step-size updates
  - tracking drifting rewards in a nonstationary bandit

### 2. Optimistic values and UCB
- [02_optimistic_initial_values_and_ucb.ipynb](./02_optimistic_initial_values_and_ucb.ipynb)
- Covers Section 2.6 and Section 2.7
- Topics:
  - optimistic initial values
  - greedy exploration through optimistic estimates
  - upper-confidence-bound action selection

### 3. Gradient bandits
- [03_gradient_bandit.ipynb](./03_gradient_bandit.ipynb)
- Covers Section 2.8
- Topics:
  - action preferences
  - softmax policies
  - gradient updates with and without a reward baseline

## Suggested Reading Order

1. `01_incremental_and_nonstationary.ipynb`
2. `02_optimistic_initial_values_and_ucb.ipynb`
3. `03_gradient_bandit.ipynb`

This order follows the conceptual flow of the chapter: first value estimation, then exploration strategies, then direct policy optimization.

## Dependencies

Install the minimal dependencies with:

```bash
pip install numpy matplotlib notebook
```

## Notes

- Each notebook is self-contained on purpose.
- The implementations are intentionally small, even if that means some helper code is repeated.
- If you want, this folder can later be expanded into a reusable Python module with shared utilities for bandit environments and plotting.
