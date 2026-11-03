# Releasing

Releases are published to npm as [`@gpxco/mcp`](https://www.npmjs.com/package/@gpxco/mcp) by the `release` workflow when a GitHub release is published.

## When to release

- The API changed: the weekly `spec-check` workflow fails, or you know an endpoint was added, removed or re-documented in gpx-engine.
- The server itself changed.

## Steps

1. Refresh the spec if the API changed:

   ```bash
   npm run spec:update
   npm run generate
   npm test
   ```

   Read the diff of `src/generated/operations.json`. A renamed or removed tool breaks anyone whose assistant relies on it, so treat that as a breaking change.

2. Bump the version without a commit or tag, for example:

   ```bash
   npm version minor --no-git-tag-version
   ```

   Use `minor` for new tools, `major` for renamed or removed tools, and `patch` for anything else.
3. Open a PR with the spec, the generated file and the version bump, then merge it to `main`.
4. On GitHub, create a release from `main` with tag `v<version>` (for example `v0.2.0`), and write the notes. Tick **Set as a pre-release** for a version you want to test first: it is published under the `next` dist-tag (`npx -y @gpxco/mcp@next`), and `npx -y @gpxco/mcp` keeps installing the last full release.
5. Publishing the release runs `.github/workflows/release.yml`. It checks that the tag matches `package.json`, runs the checks and **stages** the version with provenance. A staged version is on the registry but nobody can install it yet.
6. An npm owner approves it, which needs their two-factor code. Check what was staged before approving: it should be the version you released, built from the release's commit.

   ```bash
   npm stage list @gpxco/mcp
   npm stage view <stage-id>
   npm stage download <stage-id>
   npm stage approve <stage-id>
   ```

   `npm stage download` saves the tarball for a look inside. If anything is off, `npm stage reject <stage-id>` removes it. The package's page on npmjs.com shows staged versions too.
7. Check it: `npm view @gpxco/mcp dist-tags` shows the new version, and `npx -y @gpxco/mcp@<version>` starts and waits on stdin. Stop it with Ctrl-C.

The tag a version is staged with (`latest` or `next`) cannot be changed. To change it, reject the staged version and run the workflow again.

## Setup, once

- An npm organization named `gpxco`, owned by GPX, with at least two owners.
- The package published once by hand by an owner (`npm ci && npm publish --provenance=false` from a clean checkout of `main`), because npm can only attach a trusted publisher to a package that exists. Provenance is generated only in GitHub Actions, so the manual publish skips it; every release after that has it.
- On npmjs.com, under the package's **Settings › Trusted publishing**, a GitHub Actions publisher: organization `gpxco`, repository `gpx-mcp`, workflow `release.yml`, with only the **npm stage publish** permission. The workflow authenticates over OIDC, so there is no npm token to store, expire or rotate, and it can stage a version but never publish one. A stolen workflow run or a malicious dependency therefore cannot put code in front of customers without an owner's two-factor approval.
- The package's **Publishing access** set to require two-factor authentication and disallow tokens.
