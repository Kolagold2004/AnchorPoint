# Multisig Escrow Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `esc_init` | `(signers, threshold, recipient)` | The escrow is initialized. |
| `released` | `(signers, token, recipient, amount)` | The configured signers authorize a non-empty token balance release. |
