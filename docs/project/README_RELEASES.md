# Release & Deployment Guide

## Required workflow
- Enable **Squash and merge** and disable **Merge commit** under **Settings → General → Pull Requests** so every merge produces a single Conventional Commit derived from the PR title.
- Keep PR titles in [Conventional Commit](https://www.conventionalcommits.org/) format such as `feat: add customer portal`, `fix: correct typo`, `feat!: migrate settings storage`, or include a `BREAKING CHANGE:` footer when needed.
- The **PR Title Lint** workflow will block merges whose titles do not pass the format check—update the title and re-run the check to proceed.

## Release flow
1. Merge feature branches into `main` using squash merges.
2. `release-please` runs on every push to `main`. It keeps a draft **release PR** up to date with the next semantic version, changelog, and package version bump.
3. When you merge the release PR, `release-please` automatically tags the merge commit as `vX.Y.Z` and publishes a GitHub Release. All commits merged since the previous tag are batched into this single release.
4. When release-please creates a GitHub Release, the `Release Please` workflow calls `Release Artifacts on Tag` directly. The artifact job checks that the tag matches `package.json`, `package-lock.json`, and the built manifest, then uploads `app-vX.Y.Z.tar.gz` and a signed `kotodama-X.Y.Z.crx` to that release. The direct call is needed because GitHub does not start a follow-on workflow for events created with `GITHUB_TOKEN`.

## Release artifacts
- The archive contains the built extension in `dist/`; source maps are omitted to keep downloads small.
- Download the archive and signed CRX from the GitHub Release assets list. Their filenames are `app-<tag>.tar.gz` and `kotodama-<version>.crx`.
- Need to rebuild assets for an existing release? Run **Actions → Release Artifacts on Tag** and enter the published tag, such as `v1.8.0`.

## Secrets & optional integrations
- `GITHUB_TOKEN` is provided automatically in GitHub Actions and is sufficient for release-please and uploading release assets.
- Configure the repository secret `CHROME_EXTENSION_PRIVATE_KEY` with the extension's PEM signing key. The artifact job fails visibly if it cannot create the CRX or archive.
- `NPM_TOKEN` (optional) can be added later if you choose to publish the package to npm as part of the tag workflow.
- Optional deployment hooks:
  - **Render**: add `RENDER_DEPLOY_HOOK` to repository secrets and trigger it from an additional job after the archive upload.
  - **Netlify**: supply `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets, then call the Netlify CLI or deploy API from a follow-up workflow (commonly via `workflow_run` on `Release Artifacts on Tag`).

## Troubleshooting
- If release-please fails, inspect the workflow logs on the `Release Please` run. Fix commit messages or conflicts, then re-run the job from the Actions UI.
- If the tag workflow fails, resolve the issue (for example, missing build output), push a fix to `main`, and use the **Re-run jobs** button to rebuild and re-attach the artifact.
