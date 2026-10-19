# Indexing Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `user_reg`, `user_id` | `address` | A new user is assigned an ID. Existing registration lookups emit nothing. |
| `active`, `user_id` | `bool` | A user's active bitmap is changed. |
| `activity`, `user_id` | `timestamp` | The last-active timestamp is updated. |
| `user_data`, `user_id` | `UserData` | User data is stored. |
