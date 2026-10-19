# Security Registry Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `init` | `admin` | The registry is initialized. |
| `adm_prop`, `current_admin` | `proposed_admin` | An administrator transfer is proposed. |
| `adm_xfer` | `(old_admin, new_admin)` | A pending administrator accepts. |
| `adm_cxl` | `current_admin` | The current administrator cancels a proposal. |
| `pause`, `admin` | `true` | The global registry pause is enabled. |
| `unpause`, `admin` | `false` | The global registry pause is disabled. |
| `p_flags`, `admin` | `PauseState` | Granular pause flags are replaced. |
| `c_pause` | `(admin, contract_id)` | A contract-specific pause is enabled. |
| `c_unpause` | `(admin, contract_id)` | A contract-specific pause is disabled. |
