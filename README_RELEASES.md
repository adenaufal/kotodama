# Release & Deployment Guide

## Required workflow
- Enable **Squash and merge** and disable **Merge commit** under **Settings → General → Pull Requests** so every merge produces a single Conventional Commit derived from the PR title.
- Keep PR titles in [Conventional Commit](https://www.conventionalcommits.org/) format such as `feat: add customer portal`, `fix: correct typo`, `feat!: migrate settings storage`, or include a `BREAKING CHANGE:` footer when needed.
- The **PR Title Lint** workflow will block merges whose titles do not pass the format check—update the title and re-run the check to proceed.

## Release flow
1. Merge feature branches into `main` using squash merges.
2. `release-please` runs on every push to `main`. It keeps a draft **release PR** up to date with the next semantic version, changelog, and package version bump.
3. When you merge the release PR, `release-please` automatically tags the merge commit as `vX.Y.Z` and publishes a GitHub Release. All commits merged since the previous tag are batched into this single release.
4. The `Release Artifacts on Tag` workflow detects the new tag, rebuilds the project, packages the build output into `app-vX.Y.Z.tar.gz`, and attaches it to the GitHub Release.

## Release artifacts
- Build artifacts are searched in `.next/`, `dist/`, or `build/`. Any directories that exist are included in the tarball (source maps are omitted to keep downloads small).
- Download the packaged archive from the GitHub Release assets list. The filename follows `app-<tag>.tar.gz`.
- Need a fresh archive? Re-run the workflow from the **Actions** tab → `Release Artifacts on Tag` → choose the `v*.*.*` run → **Re-run all jobs**.

## Secrets & optional integrations
- `GITHUB_TOKEN` is provided automatically in GitHub Actions and is sufficient for release-please and uploading release assets.
- `NPM_TOKEN` (optional) can be added later if you choose to publish the package to npm as part of the tag workflow.
- Optional deployment hooks:
  - **Render**: add `RENDER_DEPLOY_HOOK` to repository secrets and trigger it from an additional job after the archive upload.
  - **Netlify**: supply `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets, then call the Netlify CLI or deploy API from a follow-up workflow (commonly via `workflow_run` on `Release Artifacts on Tag`).

## Troubleshooting
- If release-please fails, inspect the workflow logs on the `Release Please` run. Fix commit messages or conflicts, then re-run the job from the Actions UI.
- If the tag workflow fails, resolve the issue (for example, missing build output), push a fix to `main`, and use the **Re-run jobs** button to rebuild and re-attach the artifact.
