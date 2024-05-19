# **semantic-release-pnpm-deps**

It's a [**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to analyze dependencies updates in pnpm workspace and auto publish a new version if necessary.

## Feature 
- Support analyze dependencies / devDependencies / peerDependencies types.
- Update the `changelog.md` the dependenices / devDependencies / peerDependencies updates.
- Can skip some packgaes or skip some dependenices;


## How it works

The plugin will run the semantic-release life cycle steps:


| Step             | Description                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verifyConditions` | Verify the pnpm environment. Verify the plug-in configuration. |
| `analyzeCommits` | Analyze whether the internal dependencies of the current package have been updated and decide whether to release a new version. |
| `generateNotes` | Generate notes related to dependent updates. |
| `success` | Record the successful release of the current package version to provide information for subsequent dependency analysis of other packages. |


## Install

```bash
$ npm install semantic-release-pnpm-deps -D
$ npm install semantic-release-monorepo -D  # peerDependencies
$ npm install semantic-release-plugin-pnpm -D # peerDependencies
```

## Config

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```javascript
{
  branches: ['master', { name: 'alpha', prerelease: true }, { name: 'beta', prerelease: true }],
  dryRun: true,
  extends: 'semantic-release-monorepo', // [peerDependencies] support monorepo of semantic-release
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    'semantic-release-plugin-pnpm', // [peerDependencies] replace `@semantic-release/npm`, support pnpm public
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'], 
        message: 'chore(release): ${nextRelease.version} [skip ci] [CI SKIP] \n\n${nextRelease.notes}'
      }
    ],
    [
      'semantic-release-pnpm-deps',  // [Usage] support pnpm worspace dependenices analyze, auto release new version
      {
        analyzeDepTypes: ['dependencies', 'devDependencies', 'peerDependencies'],
        depsAutoReleaseType: 'patch', // inherit | major | minor | patch(default)
        ignorePackages: [], // e.g: ['@test/pkg1']
        ignoreDeps: {} // e.g {'@test/pkg5' : ['@test/pkg1', '@test/pkg2']}
      }
    ],
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd: 'pnpm build'
      }
    ]
  ],
}
```

## Usage
in workspace package.json :
```json
{
  "scripts": {
    "semantic-release-mono": "pnpm -r --workspace-concurrency=1 exec -- npx --no-install semantic-release -e semantic-release-monorepo"
  }
}
```
  
