# Random Generator Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `rng_init` | `(admin, min_commits)` | The contract is initialized. |
| `commit` | Commitment and participant values | A participant commits. |
| `reveal` | Participant and round values | A commitment is revealed. |
| `rng_fin` | Final seed/result values | A round is finalized. |
