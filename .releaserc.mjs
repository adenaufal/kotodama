import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MODULE_NOT_FOUND_CODES = new Set(['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND']);

function resolveReleaseNotesPlugin() {
  const candidates = [
    '@semantic-release/release-notes-generator',
    'semantic-release/node_modules/@semantic-release/release-notes-generator'
  ];

  for (const specifier of candidates) {
    try {
      require.resolve(specifier);
      return specifier;
    } catch (error) {
      if (!MODULE_NOT_FOUND_CODES.has(error.code)) {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to locate a release notes generator plugin. Install @semantic-release/release-notes-generator or rely on the copy bundled with semantic-release.`
  );
}

const releaseNotesPluginPath = resolveReleaseNotesPlugin();

export default {
  $schema: 'https://unpkg.com/@semantic-release/config-schema/schema.json',
  _comment_branches:
    'To release from main only, set "branches": ["main"] and remove the release branch entry.',
  branches: [
    'release',
    {
      name: 'main',
      prerelease: true
    }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    [
      releaseNotesPluginPath,
      {
        preset: 'conventionalcommits',
        writerOpts: {
          commitsSort: ['scope', 'subject']
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'artifacts/app-*.tar.gz',
            label: 'Build archive'
          }
        ]
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]'
      }
    ]
  ]
};
