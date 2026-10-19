# Soroban Gas Benchmarks

Run the benchmark tests with:

```sh
cargo test -p soroban-gas-benchmarks benchmark_ -- --nocapture
```

Rust CI runs this command on pull requests and retains the printed measurements in the job log. Measurements use Soroban's CPU-instruction and memory-byte budget counters; they are useful for comparing runs on the same SDK/toolchain, not as wall-clock timings.

| Benchmark | Workload | Correctness result | Measurements |
| --- | --- | --- | --- |
| `stake_and_claim_n_epochs` | One initial stake, then a top-up and claim in each of 1, 10, and 100 ledger epochs | All claims complete successfully | CPU and memory deltas printed for each epoch count |
| `snapshot_weight_1000_stakers` | 1,000 stakers with 100 units each; query all balances at the closed epoch | Snapshot weight is 100,000 | CPU and memory deltas printed for the full query |

Each output line includes the workload parameters and the measured `cpu` and `mem` deltas. Keep the CI log with the pull request when evaluating changes to checkpoint or claim costs; compare measurements from equivalent runner and SDK versions.