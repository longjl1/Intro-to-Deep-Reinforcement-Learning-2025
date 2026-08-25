# Final Project: Discrete-Action CarRacing DQN

This experimental workspace applies a convolutional Deep Q-Network to Gymnasium's `CarRacing-v3` environment with its five-action discrete interface.

## Notebooks

- [`new.IPYNB`](new.IPYNB): consolidated DQN implementation and recommended starting point
- [`test.ipynb`](test.ipynb): earlier, cell-by-cell development version

Both notebooks preprocess RGB frames to a `(1, 96, 96)` grayscale observation and use replay memory plus a target network. The CNN produces an `8 x 8 x 64` feature map before the fully connected layers.

## Setup

From the repository root:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-final.txt
cd final
jupyter lab
```

Run Jupyter from `final/` so checkpoints are saved under `final/models/`. Training defaults to 500 episodes and can take a long time; reduce `MAX_EPISODES` and `MAX_STEPS` for a smoke test.

## Implementation Notes

- The environment is created with `continuous=False`, so actions are integer values from 0 to 4.
- Replay-buffer observations already include the channel axis. A sampled batch therefore has shape `(B, 1, 96, 96)`.
- The checkpoint directory is ignored by Git to prevent large model artifacts from entering the repository.
