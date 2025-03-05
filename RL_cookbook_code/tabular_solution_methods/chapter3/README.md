# Chapter 3: Finite Markov Decision Processes

This folder contains compact, notebook-first notes for **Chapter 3** of Sutton and Barto's *Reinforcement Learning: An Introduction*.

These notebooks are designed in the same spirit as the Chapter 2 materials:

- minimal code
- clear Markdown explanations
- small finite MDP examples
- easy-to-rerun cells for study and GitHub portfolio use

## Notebook Guide

### 1. Finite MDP basics
- [01_finite_mdp_basics.ipynb](./01_finite_mdp_basics.ipynb)
- Topics:
  - state space, action space, rewards, transitions
  - the Markov property
  - discounted return

### 0. Chapter overview
- [00_chapter3_overview.ipynb](./00_chapter3_overview.ipynb)
- Topics:
  - chapter roadmap
  - concept map for finite MDPs

### 1. Finite MDP basics
- [01_finite_mdp_basics.ipynb](./01_finite_mdp_basics.ipynb)
- Topics:
  - state space, action space, rewards, transitions
  - the Markov property
  - discounted return

### 2. Discounted returns and episodes
- [02_discounted_returns_and_episodes.ipynb](./02_discounted_returns_and_episodes.ipynb)
- Topics:
  - episodic returns
  - role of the discount factor
  - comparing fast and delayed rewards

### 3. Markov property and transition dynamics
- [03_markov_property_and_transition_dynamics.ipynb](./03_markov_property_and_transition_dynamics.ipynb)
- Topics:
  - transition model representation
  - Markov property
  - expected immediate reward

### 4. Bellman expectation equations
- [04_bellman_expectation_equations.ipynb](./04_bellman_expectation_equations.ipynb)
- Topics:
  - state-value functions
  - action-value functions
  - Bellman expectation equation for a fixed policy

### 5. State values and action values
- [05_state_value_and_action_value_relationship.ipynb](./05_state_value_and_action_value_relationship.ipynb)
- Topics:
  - relationship between $v_\pi$ and $q_\pi$
  - policy-weighted averaging
  - one-step lookahead

### 6. Bellman optimality and greedy policies
- [06_bellman_optimality_and_greedy_policies.ipynb](./06_bellman_optimality_and_greedy_policies.ipynb)
- Topics:
  - optimal value functions
  - Bellman optimality equation
  - greedy improvement

### 7. Policy evaluation on a tiny MDP
- [07_policy_evaluation_on_tiny_mdp.ipynb](./07_policy_evaluation_on_tiny_mdp.ipynb)
- Topics:
  - repeated Bellman expectation updates
  - convergence under a fixed policy

### 8. Policy improvement by one-step lookahead
- [08_policy_improvement_one_step_lookahead.ipynb](./08_policy_improvement_one_step_lookahead.ipynb)
- Topics:
  - action scoring from value estimates
  - greedy one-step policy improvement

### 9. Small gridworld case study
- [09_small_gridworld_case_study.ipynb](./09_small_gridworld_case_study.ipynb)
- Topics:
  - finite MDP modeling
  - iterative policy evaluation
  - greedy one-step improvement

### 10. Formula sheet
- [10_formula_sheet.ipynb](./10_formula_sheet.ipynb)
- Topics:
  - return
  - value-function definitions
  - Bellman expectation and optimality equations

## Suggested Reading Order

1. `00_chapter3_overview.ipynb`
2. `01_finite_mdp_basics.ipynb`
3. `02_discounted_returns_and_episodes.ipynb`
4. `03_markov_property_and_transition_dynamics.ipynb`
5. `04_bellman_expectation_equations.ipynb`
6. `05_state_value_and_action_value_relationship.ipynb`
7. `06_bellman_optimality_and_greedy_policies.ipynb`
8. `07_policy_evaluation_on_tiny_mdp.ipynb`
9. `08_policy_improvement_one_step_lookahead.ipynb`
10. `09_small_gridworld_case_study.ipynb`
11. `10_formula_sheet.ipynb`

## Dependencies

Install the minimal dependencies with:

```bash
pip install numpy matplotlib notebook
```

## Notes

- The implementations are intentionally small and self-contained.
- Chapter 3 is more conceptual than Chapter 2, so these notebooks focus on value definitions and Bellman reasoning.
- The final gridworld notebook is included to make the concepts more concrete before moving on to later algorithmic chapters.
