---
description: Update the CHANGELOG.md file with the latest changes.
---

1. **Identify Changes**: Review the file changes and git history of the current task to understand what was accomplished.

2. **Categorize**: Classify changes into:
   - `### 🚀 Added`: New functionality.
   - `### 🔧 Changed`: Perubahan pada fitur existing.
   - `### 🐛 Fixed`: Bug corrections.
   - `### 🛠️ Refactor`: Code restructuring without behavioral change.
   - `### 💥 Removed`: Fitur yang dihapus (breaking bagi user).
   - `### 🔒 Security`: Perubahan pada trust boundary, enkripsi, atau rate limiting.

3. **Do NOT bump versions by hand.**
   - `release-please` derives the version from Conventional Commit messages and writes `package.json` itself.
   - `scripts/build.js` stamps `package.json`'s version into `dist/manifest.json` at build time, so the manifest never needs a manual edit.
   - Head the new entry `## [Unreleased]` unless the user explicitly names a version.
   - If the user *does* name one, edit `package.json` and `public/manifest.json` to match, and say plainly that this pre-empts release-please.

4. **Read Changelog**: Read `CHANGELOG.md` to see the current state and match its tone (recent entries are written in Indonesian).

5. **Update Changelog**: Add the new entry at the top:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🚀 Added
- **Nama fitur**: Deskripsi singkat yang menyebut file atau perilaku konkret.
```

6. **Verify**: Re-read the entry and confirm every claim matches the code. A changelog describing features that were never built is worse than no changelog.
