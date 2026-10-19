# Bridge Stub Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `br_init` | `(admin, bridge_token, relayer, relayer_key)` | The bridge stub is initialized. |
| `br_burn` | Destination recipient (user, amount, destination chain are topics) | Tokens are burned for an outbound bridge transfer. |
| `br_mint` | Nonce (recipient, amount, source chain are topics) | A relayer mints an inbound bridge transfer. |
