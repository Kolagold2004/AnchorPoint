# KYC Verifier Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `VerifierInitialized` | `(admin, verifier_pubkey)` | The verifier is initialized. |
| `kyc`, `kyc_set` | `(user, expires_at)` | A valid KYC proof is recorded. |
| `VerifierKeyRotated` | `(old_pubkey, new_pubkey)` | The admin rotates the verifier key through `rotate_verifier_key` or the legacy `update_verifier` alias. |
| `kyc_rev`, `user` | `()` | The admin revokes a KYC record. |
