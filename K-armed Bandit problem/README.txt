Homework 1: 

This folder contains implementations and analyses of action-selection methods in the 10-armed bandit problem using reinforcement learning. 

- Hw1_part1.ipynb - sample-average method or constant step-size method?
- Hw1_part2.ipynb - Extended analysis with different different action-selection methods.



Hw2_part1.ipynb:

This notebook shows the implementations of sample-average method and constant step-size method?
- class ten_armed_bandit defines the agent with k arms.
- function run() shows the experiments
np.random.seed(1) for recording the random experiments.

In Constants session:

it defined some constant that will be used in the agent and update the reward:
num_arms: the number of actions is 10  
num_steps: action choose in 10000 time steps 
num_exp: this is indivial runs, which is 2000  
epsilon: the parameter in ε-Greedy Method, which is 0.1  
alpha: the parameter of constant step size alpha, which is 0.1 
random_walks: this defines the changing in action reward, which is 0.01 

- ε-Greedy Implementation:
  - With probability 1 - ε, the algorithm selects the action with the highest estimated reward.
  - With probability ε, it selects a random action.
  - The action-value estimate is updated as: Q(t+1)(a) = Q(t)(a) + α (R(t) - Q(t)(a))
where α is a step-size parameter as mentioned above.


Hw2_part2.ipynb: 
This file tested the following method
- ε-Greedy Method
- Softmax Action Selection
- Upper Confidence Bound (UCB)

Implementation Details:

10-Armed Bandit Setup: The environment consists of k arms, each with a randomly assigned true reward value. same as the part1

ε-Greedy Implementation: same as part 1.

Softmax Action Selection Implementation: P(a) = exp(Q(a)/τ) / Σ(exp(Q(b)/τ)) where τ we use 1 in this experiment.

UCB Action Selection Implementation: A(t) = argmax(Q(t)(a) + c sqrt(ln t / N(t)(a+1e-5))): use 1e-5 to avoid 0


How to run the code? use jupyter notebook python 3.12.0 version.
Notes about code parts are also in jupyter notebook files.
1. Open Hw1_part1.ipynb and execute all cells to run the experiment of part 1.
2. Open Hw1_part2.ipynb and execute all cells to run the experiments of part 2.


