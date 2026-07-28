---
description: Update CLAUDE.md when there are significant changes to project structure, commands, architecture, or conventions.
---

1. **Assess Changes**: Determine if recent changes affect project scope, commands, architecture or data flow, code organisation, theming, or known issues.

2. **Read CLAUDE.md** before editing.

3. **Update Sections**:
   - **Traps**: The highest-value section — anything that breaks *silently* belongs here (wrong-tweet selection, provider params rejected with a 400, the second content-script build pass). Add to it when you discover a new one; remove an entry only when the code makes that failure impossible.
   - **Commands**: If `package.json` scripts changed.
   - **Architecture / Data flow**: If modules, messages, or the reply flow moved.
   - **AI integration**: The provider table — verify defaults and fallbacks against `src/api/*.ts`.
   - **Conventions**: If layout, theming tokens, or file organisation shifted.
   - **Known issues**: Add new ones, delete fixed ones.

4. **Keep it dense.** CLAUDE.md is read in full on every session, so length is a real cost.
   - Do not restate what a config file already says — an agent can read `tsconfig.json` or `manifest.json` itself.
   - Prefer the non-obvious *why* over the discoverable *what*: "taking `articles[0]` replies to the wrong tweet" earns its line; "strict mode is enabled" does not.
   - Delete stale content outright rather than annotating it as historical.

5. **Verify**: Every file path resolves and every claim matches the code.
