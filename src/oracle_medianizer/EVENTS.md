# Oracle Medianizer Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `orcl_init` | `(admin, min_sources)` | The medianizer is initialized. |
| `orcl_add`, `oracle/added` | Oracle source | A source is authorized. |
| `orcl_rm`, `oracle/removed` | Oracle source | A source is removed. |
| `heartbeat` | `(admin, seconds)` (asset is a topic) | Per-asset heartbeat changes. |
| `dev_set` | `(admin, threshold_bps)` (asset is a topic) | Per-asset deviation threshold changes. |
| `submit` | Price (asset and oracle are topics) | An oracle submits a price. |
| Median update event | Asset and calculated median | The median price changes. |
