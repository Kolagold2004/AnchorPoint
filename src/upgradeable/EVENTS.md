# Upgradeable Contract Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `sec_reg` | Registry address | A security registry is configured. |
| `upg_init` | `(admin_list, initial_schema_version)` | The contract is initialized. |
| `upgrade/proposed` | `(admin, wasm_hash)` | An upgrade is proposed. |
| Approval, execution, cancellation, and admin replacement events | Proposal/admin identifiers and resulting state | Upgrade lifecycle or administrator state changes. |
