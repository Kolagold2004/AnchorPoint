# Upgrade Proxy Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `init` | `(admin, implementation)` | The proxy is initialized. |
| `impl_req` | Requesting admin and implementation | A direct implementation upgrade is requested. |
| `upgraded` | Previous/new implementation or wasm hash | An upgrade is applied. |
| `adm_xfer` | `(old_admin, new_admin)` | Proxy administration changes. |
| `appr_add`, `appr_rm` | Approver and caller | An approver is added or removed. |
| `upg_req`, `upg_appr`, `upg_cncl` | Proposal, approval count, or caller | A timelocked upgrade is requested, approved, or cancelled. |
| `rqa_set` | Caller and required approval count | The upgrade threshold changes. |
