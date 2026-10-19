# Random Number Generator Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `rng_init` | `(admin, min_participants)` | The generator is initialized. |
| `round`, `started` | Round ID | A round starts. |
| `commit` | Commitment (round and user are topics) | A participant commits. |
| `phase`, `reveal` | Round/phase details | The reveal phase begins. |
| `reveal` | User (round ID is a topic) | A participant reveals. |
| `seed` | Random seed (round is a topic) | The round is finalized. |
