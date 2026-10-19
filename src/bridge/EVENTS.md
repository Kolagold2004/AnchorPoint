# Bridge Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `br_init` | `(admin, relayer_key, min_collateral_ratio)` | The bridge is initialized. |
| `bridge_mn` | Verified inbound message details | A bridge mint is processed. |
| `bridge_bn` | Verified outbound message details | A bridge burn is processed. |
| `collat_up` | Source chain and token collateral values | Source collateral accounting changes. |
| `min_ratio` | `min_collateral_ratio` (admin is a topic) | The collateral ratio threshold changes. |
| `emergency/activated`, `emergency/deactivtd` | Admin/action details | Emergency mode changes. |
| `emergency/withdraw` | User, token, amount | Emergency withdrawal completes. |
