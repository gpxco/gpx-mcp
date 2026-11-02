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
5. Publishing the release runs `.github/workflows/release.yml`. It checks that the tag matches `package.json`, runs the checks and publishes with provenance.
6. Check it: `npx -y @gpxco/mcp@<version>` should start and wait on stdin. Stop it with Ctrl-C.

## Setup, once

- An npm organization named `gpxco`, owned by GPX, with at least two owners.
- The package published once by hand by an owner (`npm publish` from a clean checkout of `main`), because npm can only attach a trusted publisher to a package that exists.
- On npmjs.com, under the package's **Settings › Trusted publishing**, a GitHub Actions publisher: organization `gpxco`, repository `gpx-mcp`, workflow `release.yml`. The workflow then publishes over OIDC, so there is no npm token to store, expire or rotate.
