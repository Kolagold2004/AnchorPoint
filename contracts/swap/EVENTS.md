# Concentrated-Liquidity Swap Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `pool_init` | `(token_a, token_b, sqrt_price_x96, tick)` | The pool is initialized. |
| `mint` | `(recipient, tick_lower, tick_upper, liquidity, amount0, amount1)` | Liquidity is added. |
| `swap` | `SwapEvent` | A swap completes, including direction, amounts, price, and tick. |
| `collect` | `(recipient, tick_lower, tick_upper, amount0, amount1)` | Position fees are collected. |
| `burn` | `(owner, tick_lower, tick_upper, liquidity, amount0, amount1)` | Liquidity is removed. |
| `set_ref` | `referrer` (user is a topic) | A referral is set. |
| `set_refee` | `fee_rate` | Referral fee rate changes. |
