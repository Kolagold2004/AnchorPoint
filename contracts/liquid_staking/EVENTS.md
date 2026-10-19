# Liquid Staking Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `ls_init` | `(admin, stake_token, reward_token, nft_contract)` | The staking contract is initialized. |
| `fee_set` | `fee_bps` (caller is a topic) | Emergency-withdraw fee changes. |
| Existing reward-deposit, stake, unstake, emergency-withdraw, fee, pause, and claim topics | User/token/amount/fee values | Staking balances, rewards, or administration changes. |
| `claimed` | `(user, token_id, reward)` and indexed claim topics | NFT reward accounting updates, including zero-reward claims. |
