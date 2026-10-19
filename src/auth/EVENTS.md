# RBAC Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `rbac/role_set` | `(account, role)` | An administrator assigns a role or initializes the first admin. |
| `role_rev` | Revoked role (account is a topic) | An administrator revokes a role. |
| `auth/nonce_use` | `(account, previous_nonce)` | A nonce is consumed. |
| `auth/verified` | Account | Authentication succeeds. |
| `sec_reg` | Registry address | The standalone RBAC contract configures a security registry. |
