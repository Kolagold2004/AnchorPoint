# Oracle Consumer Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `orcl_init` | `(admin, primary_oracle)` | The consumer is initialized. |
| `oracle/fallback` | `(asset, secondary_oracle)` | The primary source is unavailable or stale and fallback succeeds. |
| `oracle/price_upd` | `(asset, price)` | A local price record and observation history are updated. |
| `orcl_set`, `orcl2set` | New primary or secondary oracle (admin is a topic) | An oracle source changes. |
| `twap_set`, `age_set`, `stale_set` | New configuration value (admin is a topic) | TWAP or staleness settings change. |
