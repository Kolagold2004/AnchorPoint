# Batch Executor Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `init` | `admin` | The executor is initialized. |
| `exec`, `batch` | `(caller, nonce, call_count)` | A batch completes successfully. |
| `batch_r`, `caller` | `(nonce, succeeded, failed, skipped)` | A retry-enabled batch completes. |
| `xfer_bat`, `caller` | `(operation_count, executed_count)` | A batch of token transfers completes. |
