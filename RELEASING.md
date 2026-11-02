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

2. Bump the version: `npm version patch|minor|major --no-git-tag-version`. Use a minor bump for new tools, a major bump for renamed or removed tools, and a patch bump for anything else.
3. Open a PR with the spec, the generated file and the version bump, then merge it to `main`.
4. On GitHub, create a release from `main` with tag `v<version>` (for example `v0.2.0`), and write the notes.
5. Publishing the release runs `.github/workflows/release.yml`. It checks that the tag matches `package.json`, runs the tests and publishes with provenance.
6. Check it: `npx -y @gpxco/mcp@<version>` should start and wait on stdin. Stop it with Ctrl-C.

## Setup, once

- An npm organization named `gpxco`, owned by GPX, with at least two owners.
- An npm automation token with publish rights on `@gpxco`, stored as the `NPM_TOKEN` secret on this repository.
