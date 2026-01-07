---
description: Update CLAUDE.md when there are significant changes to project structure, commands, architecture, or conventions.
---

1. **Assess Changes**: Determine if recent changes affect:
   - Project overview or scope.
   - Common commands (build scripts, testing).
   - Architecture (new components, data flow changes).
   - File organization.
   - Tech stack versions.
   - Known issues.

2. **Read CLAUDE.md**:
   - Command: `view_file CLAUDE.md`

3. **Update Sections**:
   - **Common Commands**: Update if `package.json` scripts changed.
   - **Architecture**: Update if new modules/services were added (e.g., adding Gemini provider).
   - **File Organization**: Update if the folder structure shifted.
   - **Known Issues**: Add new bugs or remove fixed ones.
   - **Documentation**: Update the docs index if new files were added.

4. **Verify**: Ensure the file remains a single source of truth for the agent (you) to understand the project.
