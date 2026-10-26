# Main website source reconciliation

This revision records the completed main website work already deployed as `fmw-workspaces` version `fd48e212-5075-4da8-b684-64832272b988`: the 500-idea Build a Business flow, its existing inquiry/inbox integration and game fixes, the published Tanoshi origin-story blog and generator, workspace welcome pages, and the existing public Troy viewing behavior. It also retains the newer Troy strategy/tutorial commits from the remote branch.

The earlier Business identifier `5540ce86cb2dc78b0ca9201de6fba637107da69a` was an isolated local feature snapshot, not a pushed website commit. The website commit containing this document durably integrates that source with the existing repository history.

Validation: generated main Worker public assets match all 179 files of the verified live release byte for byte. Shared backend sources and existing configuration match the deployed release. Source reconciliation does not deploy the Worker, migrate data, grant access or change live permissions. GitHub Pages publishing remains a separate public-origin workflow; a Git push does not deploy `fmw-workspaces`.

The Pages job checks catalog generation, exact-match tests and blog generation. Its explicit public copy list excludes services, authoring guides, source JSON, test fixtures and generated QA/release outputs. Published blog source JSON contains only the already-public post, without raw transcripts or drafts. Guides and private authoring files remain local.

Games runtime, hosting and multiplayer source are maintained separately by the games publishing owner under `games/`, `services/games/` and `services/kingdom-multiplayer/`. The Pages copy of games is conditional on their source being present; the main Worker asset builder deliberately excludes them. Preserve the current games-specific and multiplayer routes when publishing the main Worker.

A separate generic sermon draft-workshop change was marked local and undeployed during reconciliation. It and all private revision packets, local notes, screenshots and generated release evidence are excluded pending ownership/completion review. Newest unaccepted Treetop shop work is likewise excluded and remains with its owner.
