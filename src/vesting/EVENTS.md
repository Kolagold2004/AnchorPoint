# Vesting Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `init` | `admin` | The vesting contract is initialized. |
| `admin_set`, `previous_admin` | `new_admin` | Administrative control is transferred. |
| `grant_new`, `grant_id` | `amount` | A grant is created and funded. |
| `claimed`, `grant_id` | `amount` | A beneficiary claims vested tokens. |
| `revoked`, `grant_id` | `unvested_amount` | A revocable grant is revoked. |
