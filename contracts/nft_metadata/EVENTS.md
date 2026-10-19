# NFT Metadata Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `nft_init` | `(admin, collection_name, collection_symbol)` | The collection is initialized. |
| `coll_upd` | `(caller, CollectionMetadata)` | Collection name, description, or image changes. |
| Existing mint, metadata, attribute, royalty, transfer, burn, approval, and batch-update topics | Token ID, account, and changed values | NFT ownership, approvals, or metadata change. |
