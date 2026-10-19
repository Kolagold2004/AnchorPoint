# Timelock Escrow Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `sec_reg` | `registry` | A security registry is configured. |
| `esc_init` | `(sender, recipient, token, amount, unlock_time)` | Funds are deposited and the escrow is initialized. |
| `cond_met` | `sender` | The sender marks escrow conditions met. |
| `esc_cancel` | `(escrow_id, sender, amount)` | The sender cancels before lockup and receives the balance. |
| `esc_claim` | `(recipient, token, amount)` | The beneficiary claims escrow funds. |
| `esc_refund` | `(sender, token, amount)` | The sender reclaims an expired escrow. |
| `rec_set` | `(beneficiary, optional_recovery_key)` | The beneficiary sets or clears its recovery key. |
| `ben_req` | `(recovery_key, new_beneficiary, effective_at)` | A beneficiary change is proposed. |
| `ben_set` | `(old_beneficiary, new_beneficiary)` | A matured beneficiary change is applied. |
| `ben_cancel` | `(caller, proposed_beneficiary)` | A beneficiary change proposal is cancelled. |
