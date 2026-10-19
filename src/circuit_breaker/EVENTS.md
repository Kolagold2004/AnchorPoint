# Circuit Breaker Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `cb_init` | `(admin, oracle, timelock_seconds, volatility_bps)` | The breaker is initialized. |
| `bot_add`, `bot_rm` | Admin/caller and bot | An authorized bot is added or removed. |
| `cb/ref_set`, `cb/vol_trip`, `cb/vol_ok`, `cb/vol_rec`, `cb/vol_trp` | Related volume, tier, source, and caller values | Volume thresholds or pause state change. |
| `cb/base_set`, `cb/spk_set`, `vthr_set` | Caller and configured threshold | Volume configuration changes. |
| `cb/unp_init`, `unp_cncl` | Target tier, caller, unlock time | An unpause is requested or cancelled. |
| `unpaused`, `cb/resumed` | Target tier and caller/time | The breaker is resumed or its pause tier is narrowed. |
| `tl_set`, `vbps_set`, `ora_set` | Caller and new value | Timelock, volatility, or oracle settings change. |
| `cb/cooldown`, `tripped` | Tier, caller, source, unlock time | A pause trip or cooldown is recorded. |
