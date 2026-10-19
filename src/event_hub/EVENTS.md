# Event Hub Events

| Topic | Data | Emitted when |
| --- | --- | --- |
| `event_hub/init` | `HubInitializedEvent { admin }` | The hub is initialized. |
| `event_hub/reg` | `ContractRegisteredEvent { contract }` | A source contract is registered. |
| `event_hub/unreg` | `ContractUnregisteredEvent { contract }` | A source contract is removed. |
| `event_hub/<event_type>/<source>` | `EventCapturedEvent` | A registered source event is stored and re-emitted. A canonical `CrossContractEvent` is emitted for compatibility. |
