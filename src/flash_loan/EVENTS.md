# Flash Loan Events

| Event topic | Data | Emitted when |
| --- | --- | --- |
| `sec_reg` | `registry` | The security registry is configured. |
| `fee_set` | `fee_bps` | The loan fee is changed. |
| `reward` | `reward_pool` | The reward pool is changed. |
| `flash_ln` | `(receiver, token, amount, fee)` | A single-asset flash loan is repaid. |
| `fl_multi`, `receiver` | `loan_details` | A multi-asset flash loan is repaid. |
| `fl_batch`, `receiver` | `loan_details` | A batch flash loan is repaid. |
