# Token Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `tok_init` | `(admin, decimals, name, symbol)` | Token metadata and admin are initialized. |
| `mint`, `burn` | Account and amount (token ID is a topic) | Supply changes. |
| `transfer`, `batch_xf` | Transfer participants and amounts/token IDs | Tokens are transferred. |
| `approve`, `app_all`, `xfer_from` | Owner/spender/approval values | Allowances or operator approvals change, or delegated transfer occurs. |
| `meta_set` | URI (token ID is a topic) | Token metadata changes. |
| `app_purge` | Owner and spender (token ID is a topic) | An expired allowance is removed. |
