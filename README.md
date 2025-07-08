# Deep Reinforcement Learning 2025

This repository collects reinforcement learning coursework, experimental notebooks, and a growing Python-based study implementation of core algorithms from Sutton and Barto's *Reinforcement Learning: An Introduction*.

The repo is organized as a hybrid of:

- course assignment artifacts and reports
- small experimental notebooks for classical tabular problems
- a structured `RL_cookbook_code/` directory that reimplements major textbook ideas in compact, self-contained Jupyter notebooks

## Repository Scope

The main emphasis of this repository is educational and experimental rather than production software engineering. The code is intended to support:

- concept review
- algorithm intuition
- lightweight empirical checks
- notebook-based reproduction of canonical reinforcement learning examples

Most implementations are deliberately minimal and readable. The goal is to surface the update rules, value-function definitions, approximation choices, and experimental setup clearly enough for study and adaptation.

## Repository Structure

### 1. `RL_cookbook_code/`

This is the most systematic part of the repository. It contains chapter-oriented notebook collections that summarize and implement key topics from the Sutton and Barto text in Python.

Currently covered chapters include:

- `chapter2`: multi-armed bandits
- `chapter3`: finite Markov decision processes
- `chapter4`: dynamic programming
- `chapter5`: Monte Carlo methods
- `chapter6`: temporal-difference learning
- `chapter7`: n-step bootstrapping
- `chapter8`: planning and learning with tabular methods
- `chapter9`: on-policy prediction with approximation
- `chapter10`: on-policy control with approximation

Each chapter folder typically includes:

- a short overview notebook
- several topic-specific notebooks
- a formula sheet
- a chapter README for local navigation

The implementations are original Python notebook versions written for study purposes rather than line-by-line reproductions of textbook source material.

### 2. `K-armed Bandit problem/`

Coursework and experiments related to the 10-armed testbed and action-selection methods, including:

- epsilon-greedy methods
- softmax action selection
- upper-confidence-bound action selection
- comparison plots and homework notebooks

### 3. `Racetrack problem/`

Material related to Monte Carlo reinforcement learning in the racetrack problem, including:

- written report material
- result figures
- notebook-based experimentation

### 4. `Hw3/`

FrozenLake-based homework material, including:

- notebook experiments
- generated figures
- report artifacts

### 5. `final/`

An incomplete or archival final-project workspace. This folder is not the primary focus of the current repository organization.

## Methodological Style

Across the notebook collections, the repository favors:

- tabular and low-dimensional examples before large-scale implementations
- direct numerical experiments over framework-heavy abstractions
- concise derivations paired with executable code
- transparent approximations and interpretable visualizations

This makes the repo useful as a compact research notebook companion for revisiting textbook examples, testing implementation details, and comparing related update rules across chapters.

## Dependencies

Most notebooks rely only on a small scientific Python stack:

```bash
pip install numpy matplotlib notebook
```

Some older coursework notebooks may additionally require environment packages such as `gymnasium`.

## Intended Use

This repository is best read as:

- a personal reinforcement learning study log
- a chapter-by-chapter algorithm notebook collection
- a compact reference for classical RL examples

It is less suitable as:

- a single installable RL library
- a benchmark framework
- a polished reproduction package for exact textbook figures

## License

This repository is distributed under the license included in [LICENSE](LICENSE).
