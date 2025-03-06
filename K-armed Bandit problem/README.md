# **Homework 1: Reinforcement Learning Experiments**

This repository contains implementations and analyses of **action-selection methods** in the **multi-armed bandit problem** using reinforcement learning. The assignment is divided into two parts:

- 📂 **Hw1_part1.ipynb** - Introduction to different action-selection methods and initial experiments.
- 📂 **Hw1_part2.ipynb** - Extended analysis with different hyperparameter settings and performance comparisons.

## **Project Structure**
### **1. Hw1_part1.ipynb**
This notebook introduces the **multi-armed bandit problem** and implements three different action-selection strategies:
- **\( \epsilon \)-Greedy Method**
- **Softmax Action Selection**
- **Upper Confidence Bound (UCB)**

#### **Implementation Details**
1. **Multi-Armed Bandit Setup**  
   - The environment is initialized with \( k \) arms, each having a randomly assigned **true reward value**.
   - The agent does not know these true values and must learn by interacting with the environment.

2. **\( \epsilon \)-Greedy Implementation**  
   - The algorithm selects the action with the highest estimated reward with probability \( 1 - \epsilon \), and with probability \( \epsilon \), it selects a random action.
   - The estimated action-value function is updated using:
     \[
     Q_{t+1}(a) = Q_t(a) + \alpha (R_t - Q_t(a))
     \]
     where \( \alpha \) is a step-size parameter (constant or \( 1/N_t \), the inverse of the number of times action \( a \) has been selected).

3. **Softmax Action Selection Implementation**  
   - Uses the **softmax function** to assign probabilities to actions:
     \[
     P(a) = \frac{e^{Q(a)/\tau}}{\sum_{b} e^{Q(b)/\tau}}
     \]
   - The agent **samples an action** based on these probabilities.

4. **UCB Action Selection Implementation**  
   - Balances exploration and exploitation by selecting the action with the **highest upper confidence bound**:
     \[
     A_t = \arg\max_a \left[ Q_t(a) + c \sqrt{\frac{\ln t}{N_t(a)}} \right]
     \]
   - This encourages selecting **less frequently chosen** actions early on.

5. **Performance Evaluation**  
   - The experiment tracks **average reward** and **optimal action selection percentage** over multiple time steps.

---

### **2. Hw1_part2.ipynb**
This notebook extends the previous experiments by analyzing how different **hyperparameter settings** affect performance.

#### **Implementation Details**
1. **Hyperparameter Exploration**
   - The effect of changing \( \epsilon \) in \( \epsilon \)-greedy is studied.
   - Different values of **temperature \( \tau \)** in Softmax are tested.
   - The impact of **confidence parameter \( c \)** in UCB is analyzed.

2. **Comparing Different Hyperparameter Settings**
   - The notebook runs multiple trials with different values of:
     - \( \epsilon = 0.1, 0.01, 0.2 \)
     - \( \tau = 0.5, 1, 2 \)
     - \( c = 1, 2, 5 \)
   - The results are plotted to observe trends in **average reward** and **optimal action selection**.

3. **Results Analysis**
   - **\( \epsilon \)-greedy with \( \epsilon = 0.1 \) performed the best** in terms of optimal action selection.
   - **UCB initially outperformed \( \epsilon \)-greedy** but later selected the optimal action less frequently.
   - **Softmax with \( \tau = 1 \) explored excessively**, leading to lower rewards.

---

## **Experiments and Findings**
The following conclusions were drawn based on the experimental results:
- **\( \epsilon \)-Greedy (with \( \epsilon = 0.1 \)) achieves the highest percentage of optimal action selection.**
- **UCB initially performs well but explores too much in the long run.**
- **Softmax with \( \tau = 1 \) is ineffective due to excessive exploration.**
- **Tuning hyperparameters** significantly affects performance.

---

## **Dependencies**
To run the experiments, install the required Python packages:

```bash
pip install numpy matplotlib
