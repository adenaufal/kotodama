---
description: Update README.md to reflect the latest public-facing state of the project.
---

1. **Identify Updates**:
   - New features released (check `CHANGELOG.md`).
   - Breaking changes in installation/setup.
   - Changes in prerequisites (Node version, API keys, provider support).
   - Model defaults or fallbacks that moved (`src/api/*.ts`, `src/constants/models.ts`).

2. **Read README.md** before editing.

3. **Update Sections** (the README is deliberately short — it points to `docs/`, it does not duplicate them):
   - **How it works**: The user-facing reply flow, if it changed.
   - **Install**: Setup steps and which providers onboarding accepts.
   - **Providers**: The default / fallback / vision model table — verify against `src/api/*.ts`, not memory.
   - **Architecture**: The three contexts and the `src/` tree, if the structure shifted.
   - **Known limitations**: Sync with the Known Issues section of `CLAUDE.md`.

4. **Do not add**: a version-numbered "Highlights" section or a roadmap. Both went stale faster than anyone updated them — the changelog covers what shipped, `docs/project/TODO.md` covers what is next.

5. **Verify**: Every link resolves, and every capability claimed actually exists in the code. The README claiming unbuilt features is the failure mode this workflow exists to prevent.
