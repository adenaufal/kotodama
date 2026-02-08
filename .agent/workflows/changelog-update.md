---
description: Update the CHANGELOG.md file with the latest changes.
---

1. **Identify Changes**: Review the file changes and git interaction history of the current task to understand what was accomplished.

2. **Categorize**: Classify changes into:
   - `### 🚀 Added`: New functionality.
   - `### 🔧 Changed`: Perubahan pada fitur existing.
   - `### 🐛 Fixed`: Bug corrections.
   - `### 🛠️ Refactor`: Code restructuring without behavioral change.

3. **Version Check & Update**:
   - Read `package.json` to see the current version.
   - Tentukan versi baru (MAJOR.MINOR.PATCH) berdasarkan jenis perubahan.
   - **Update `package.json`**: Update field `"version"`.
   - **Update `public/manifest.json`**: Pastikan field `"version"` sinkron dengan `package.json`.

4. **Read Changelog**: Read `CHANGELOG.md` to see the current state.
   - Command: `view_file CHANGELOG.md`

5. **Update Changelog**:
   - Tambahkan entry baru di bagian atas dengan format:

```markdown
## [X.X.X] - YYYY-MM-DD

### 🚀 Added
- Deskripsi fitur baru
```

6. **Verify**: Check all modified files to ensure versioning and formatting are correct.
