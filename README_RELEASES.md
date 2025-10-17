# Release & Deployment Guide

## Conventional Commit Summary
- `feat: add customer portal` – user-visible feature
- `fix: correct typo in onboarding copy` – bug fix
- `feat!: migrate settings storage` with `BREAKING CHANGE: resets user preferences` – breaking change (either add `!` after the type/scope or include a `BREAKING CHANGE:` footer)
- `chore: update dependencies` – maintenance work

Use **Squash and merge** so the PR title becomes the release note entry. Configure the repo under **Settings → General → Pull Requests**:
1. Enable **Allow squash merging**.
2. Disable **Allow merge commits**.
3. (Optional) Disable **Allow rebase merging** if you want a single merge strategy.

The `PR Title Lint` workflow blocks merges whose titles do not match the Conventional Commit format—fix the title and re-run the check if it fails.

## Choosing a batching strategy
- **Release branch (`release`)** – Merge `main` into `release` whenever you are ready to publish. Pushing to `release` triggers the release workflow immediately.
- **Scheduled cron** – Leave the `release` branch unused and rely on the scheduled run (daily at 00:00 Asia/Jakarta). Every successful run releases all commits since the last tag.
- Switch between the modes by commenting/uncommenting the relevant trigger in `.github/workflows/release.yml`.

## Manual releases & skip guard
- Use the **Run workflow** button on the `Release` workflow (`workflow_dispatch`) to cut an ad-hoc release.
- The workflow checks the latest Git tag. If there are no commits after that tag, it exits early and reports "Release skipped" so you do not create empty releases.

## Artifacts & GitHub Releases
- The build step gathers `.next`, `out`, `dist`, or `build` folders (whichever exist) into `artifacts/app-<short-sha>.tar.gz` before semantic-release runs.
- The GitHub release includes this archive under **Assets** with the label “Build archive”. Download it for ready-to-deploy build output.

## Secrets & tokens
- `GITHUB_TOKEN` – provided automatically; required for semantic-release and uploading assets.
- `NPM_TOKEN` – optional; add if you want the npm plugin to update package metadata or publish.
- `RENDER_DEPLOY_HOOK` – required to trigger the Render deploy hook (see `.github/workflows/deploy-render.yml`).
