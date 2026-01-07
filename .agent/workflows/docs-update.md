---
description: Update documentation to reflect codebase changes.
---

1. **Analyze Impact**: Determine which parts of the system were modified (e.g., API, UI, Setup, CLI).

2. **Identify Docs**: Locate relevant documentation in `docs/`:
   - `docs/development/DEVELOPMENT.md`: For dev workflow changes.
   - `docs/reference/API_REFERENCE.md`: For API changes.
   - `docs/reference/MODEL_REFERENCE.md`: For AI model config changes.
   - `docs/guides/QUICK_REFERENCE.md`: For usage instruction changes.
   - `docs/guides/QUICKSTART.md`: For onboarding changes.

3. **Update Content**:
   - Use `view_file` to read the target doc.
   - Use `replace_file_content` or `multi_replace_file_content` to update sections with new info.
   - Ensure code examples are up to date.

4. **New Documentation**: If a completely new feature was added (e.g., a new major module), create a new markdown file in the appropriate subdirectory and link it in `docs/README.md`.

5. **Review**: Verify that the documentation is clear, accurate, and typo-free.
