# Yield Distribution Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `sec_reg` | `registry` | A security registry is configured. |
| `init` | `(admin, stake_token, reward_token)` | Distribution is initialized. |
| `dep_rwd`, `staked`, `unstaked` | User and amount values | Reward funds or stake balances change. |
| `claimed` | `(user, reward)` | Reward accounting is updated, including zero-reward claims. |
