# AMM Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `pool_init` | `(admin, token_a, token_b)` | The pool is initialized; tokens are in canonical address order. |
| `pause`, `admin` | `(token_a, token_b)` | The pool is paused. |
| `unpause`, `admin` | `(token_a, token_b)` | The pool is resumed. |
| `deposit` | `(provider, received_a, received_b, shares)` | Liquidity is deposited. Amounts are the actual balance increases after token transfer fees. |
| `swap` | `(trader, token_in, token_out, amount_in, amount_out)` | A swap completes. |
| `withdraw` | `(provider, amount_a, amount_b, shares)` | Liquidity is withdrawn. |
