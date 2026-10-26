# Kingdom multiplayer Worker

Accepted deployed backend modules for Kingdom Conquest release `0c7cf24`, protocol2 and Rift map revision2. They match the separate live Worker `fmw-kingdom-multiplayer`, version `9dc3b7b7-e75c-43f5-ab21-e11fa8fa63a2` at source reconciliation. Generated simulation/map and required runtime modules are retained; no Node server, ws dependency, credentials or account records are needed by this Worker adapter.

This config owns only `/api/kingdom/*` on apex/www. Preserve its existing `KINGDOM_ROOMS` SQLite Durable Object binding and migration history. The `v1` migration is historical: never rename it or replay first-creation changes against an existing deployment. Do not deploy an old backend independently of the corresponding protocol/map-compatible client. Match state is in memory; a deployment/restart/eviction may end current matches. No persistent recovery claim or unverified capacity claim is made.

Main website and static games are separate Workers. Existing routes, authentication policy, billing and credentials must not be broadened as part of a source push. A Git commit is not a backend deployment.
