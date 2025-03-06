# 🚗 Racetrack Reinforcement Learning
## Solving the Racetrack Problem using Monte Carlo Methods

This project implements **Monte Carlo (MC) reinforcement learning** to solve the **Racetrack Problem**, a classic example from **Sutton & Barto’s Reinforcement Learning textbook**. The goal is to train a racecar to navigate a track efficiently while avoiding crashes.

## 📌 Problem Description
The **Racetrack Problem** involves controlling a **racecar** on a predefined track with:

- **State**: The car's **position** \((x, y)\) and **velocity** \((v_x, v_y)\).
- **Actions**: The car can **accelerate** in different directions \([-1, 0, 1]\) for both \(x\) and \(y\) velocities.
- **Rewards**: 
  - \( -1 \) for each step taken.
  - \( +10/ +100/ +10000 \) for reaching the **finish line**.
  - \( -1000 \) for crashing into a wall (reset to the starting line).
- **Objective**: Learn an **optimal policy** that minimizes the time taken to reach the finish line.

## 🛠 Installation
To run the project, ensure you have **Python 3.12.0+** and the required dependencies installed.


