---
description: Update the CHANGELOG.md file with the latest changes.
---

1. **Identify Changes**: Review the file changes and git interaction history of the current task to understand what was accomplished.

2. **Categorize**: Classify changes into:
   - `### Features`: New functionality.
   - `### Bug Fixes`: Bug corrections.
   - `### Performance Improvements`: Optimization tweaks.
   - `### Refactor`: Code restructuring without behavioral change.

3. **Read Changelog**: Read `CHANGELOG.md` to see the current state.
   - Command: `view_file CHANGELOG.md`

4. **Update Changelog**:
   - if an `## [Unreleased]` section exists, append your items there.
   - If not, create an `## [Unreleased](https://github.com/adenaufal/kotodama/compare/v1.4.0...HEAD)` section at the top (below the header). (Adjust `v1.4.0` to the actual latest version found in the file).
   - Format entries as: `* description of change`
   - *Note*: Since this project uses `release-please`, this manual update helps track unreleased changes. Ensure standard Conventional Commits messages are used in the final commit to support automation.

5. **Verify**: Check the file content to ensure it is formatted correctly.
