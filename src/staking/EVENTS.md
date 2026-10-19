# Staking Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `sec_reg` | Registry address | A security registry is configured. |
| `stk_init` | `(admin, token, base_rate, penalty_bps)` | Staking is initialized. |
| `tiers` | Tier list (admin is a topic) | Lock tiers change. |
| `emit_set` | `EmissionParams` (admin is a topic) | Dynamic emission parameters change. |
| `pen_pool` | Penalty pool address (admin is a topic) | The emergency penalty recipient changes. |
| Existing stake/withdraw/claim/emergency events | User and amount values | Stake accounting or reward payments change. |
