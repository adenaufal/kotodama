import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const releaseTag = process.env.RELEASE_TAG;

if (!releaseTag) {
  throw new Error('RELEASE_TAG is required to verify a release build.');
}

const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(releaseTag);
if (!match) {
  throw new Error(`Expected a stable vMAJOR.MINOR.PATCH release tag, received "${releaseTag}".`);
}

const tagParts = match.slice(1).map(Number);
const tagVersion = tagParts.join('.');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'dist/manifest.json'), 'utf8'));

const versions = {
  tag: tagVersion,
  package: packageJson.version,
  lockfile: packageLock.packages?.['']?.version,
  manifest: manifest.version,
};

const mismatches = Object.entries(versions)
  .filter(([, version]) => version !== tagVersion)
  .map(([source, version]) => `${source}=${version ?? '<missing>'}`);

if (mismatches.length > 0) {
  throw new Error(
    `Release version mismatch for ${releaseTag}: expected ${tagVersion}; ${mismatches.join(', ')}.`,
  );
}

const monotonicityCheckEnabled = process.env.RELEASE_CHECK_MONOTONIC !== 'false';
if (monotonicityCheckEnabled) {
  const existingTags = execFileSync('git', ['tag', '--list'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .filter((tag) => tag && tag !== releaseTag)
    .map((tag) => {
      const existingMatch = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
      return existingMatch ? { tag, parts: existingMatch.slice(1).map(Number) } : null;
    })
    .filter(Boolean);

  const compareVersions = (left, right) => {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        return left[index] - right[index];
      }
    }

    return 0;
  };
  const newerTags = existingTags.filter(({ parts }) => compareVersions(tagParts, parts) <= 0);

  if (newerTags.length > 0) {
    const newestTag = newerTags.reduce((latest, candidate) =>
      compareVersions(candidate.parts, latest.parts) > 0 ? candidate : latest,
    );
    throw new Error(`Release tag ${releaseTag} is not newer than existing release tag ${newestTag.tag}.`);
  }
}

console.log(
  monotonicityCheckEnabled
    ? `Release version verified: ${releaseTag} matches package.json, package-lock.json, and dist/manifest.json; no newer release tag exists.`
    : `Release version verified: ${releaseTag} matches package.json, package-lock.json, and dist/manifest.json; monotonicity check skipped for rebuild.`,
);
