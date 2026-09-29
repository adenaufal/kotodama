import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));

function parseVersion(version, source) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version ?? '');
  if (!match) {
    throw new Error(`${source} must contain a stable MAJOR.MINOR.PATCH version; received "${version}".`);
  }

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return 0;
}

const packageVersion = parseVersion(packageJson.version, 'package.json');
const lockVersion = packageLock.packages?.['']?.version;
if (lockVersion !== packageJson.version) {
  throw new Error(
    `package-lock.json version ${lockVersion ?? '<missing>'} does not match package.json ${packageJson.version}.`,
  );
}

const releaseTags = execFileSync('git', ['tag', '--list'], {
  cwd: root,
  encoding: 'utf8',
})
  .split(/\r?\n/)
  .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
  .map((tag) => ({ tag, version: parseVersion(tag.slice(1), `tag ${tag}`) }));

if (releaseTags.length > 0) {
  const latestTag = releaseTags.reduce((latest, candidate) =>
    compareVersions(candidate.version, latest.version) > 0 ? candidate : latest,
  );

  if (compareVersions(packageVersion, latestTag.version) < 0) {
    throw new Error(
      `package.json ${packageJson.version} is behind the latest release tag ${latestTag.tag}; refusing to release a lower version.`,
    );
  }

  console.log(`Package version verified: ${packageJson.version} is not behind ${latestTag.tag}.`);
} else {
  console.log(`Package version verified: ${packageJson.version}; no stable release tags exist yet.`);
}
