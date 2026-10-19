# Liquidation Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `liq_init` | `(oracle, collateral_token, debt_token)` | The engine is initialized. |
| `debt_cap` | `ceiling` | The global debt ceiling is set and reserve accounting is reset. |
| `vault_new` | `(vault_id, owner, collateral_amount, debt_amount)` | A vault is created. |
| `coll_add` | `(vault_id, owner, token, amount)` | The owner adds collateral in a token. |
| `amm`, `liquidate` | `(vault_id, liquidator, incentive)` | A vault is fully liquidated. |
| `p_liquid`, `vault_id`, `liquidator` | `(debt_covered, collateral_seized, incentive)` | A partial liquidation completes. |
| `res_fund` | `(funder, amount, new_reserve)` | The reserve is funded. |
| `baddebt` | `(vault_id, debt_cleared, collateral_absorbed, shortfall_value)` | The reserve clears an undercollateralized vault. |
