# Multi-Token Staking Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `stk_init` | `(admin, stake_token)` | The staking contract is initialized. |
| `rwd_add` | `(admin, reward_token)` | A reward token is newly whitelisted. |
| `dep_rwd` | `(funder, reward_token, amount)` | Rewards are deposited. |
| `paused`, `unpaused` | `()` | Staking is paused or resumed. |
| `staked`, `unstaked`, `emer_wd` | User and amount fields | Stake balances change. |
| `claimed` | User, token, reward | Rewards are claimed. |
| `meta_upd` | `ContractMetadata` | Contract metadata changes. |
