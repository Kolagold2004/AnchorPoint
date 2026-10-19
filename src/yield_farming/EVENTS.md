# Yield Farming Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `init` | `(admin, amm_pool, reward_token, reward_rate)` | The distributor is initialized. |
| `rate_set` | `(admin, new_rate)` | The reward emission rate changes. |
| `claimed` | `(user, reward_amount)` | A user's claim updates reward accounting, including a zero-reward claim. |
| `harvested` | `(fee_balance, timestamp)` | The admin harvests protocol fees. |
