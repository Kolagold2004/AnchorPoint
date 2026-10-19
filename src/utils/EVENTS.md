# Shared Utility Events

The utility crate has no independently deployed contract entrypoint. Contract metadata updates emit `meta_upd` with the updated `ContractMetadata`. The canonical `emit_event` helper publishes `(anchor, variant)` topics with the corresponding `AnchorEvent` enum payload; variants are `deposit`, `withdraw`, `swap`, `prop_cre`, `voted`, `prop_exe`, `release`, and `xcontract`.
