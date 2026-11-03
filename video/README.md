# Setup video

A one-minute walkthrough for customers: create an API token in the GPX app, then add `@gpxco/mcp` to Claude Code, Claude Desktop or Cursor. Built with [Remotion](https://www.remotion.dev): scenes are React components in `src/scenes.tsx`, and the app screens are real screenshots of app.gpx.co in `public/shots/`.

## Render

```bash
npm install
npm run render       # out/gpx-mcp-setup.mp4, 1920x1080
npm run render:gif   # out/gpx-mcp-setup.gif, 960x540, 15 fps
npm run studio       # preview and scrub in the browser
```

## Music

The background music is synthesized by `scripts/make-music.mjs` (electric piano, walking bass, vibraphone, brushes), so there is no licence or attribution to track. `npm run render` regenerates it at the video's length; `public/music.wav` is not committed. If you change scene lengths in `src/Setup.tsx`, update the seconds in the `music` script to match.

## Updating a screenshot

When the app's Settings or tracker pages change, retake the shot at a 1509x812 (settings) or 1384x797 (tracker page) browser viewport, save the raw files with the names `prepare-shots.mjs` expects into a folder outside the repository, and run:

```bash
npm run prepare-shots -- /path/to/raw/shots
```

The "Token created" screenshot shows a real token. `prepare-shots` paints over it before the file reaches `public/shots/`, and the video draws a masked token in its place, so never copy that raw screenshot into this folder by hand. Revoke the token used for the recording afterwards.

The tracker names in the shots (Delivery Van 7, Forklift 3, Reefer Trailer 12, Pallet 42) were set for the recording and restored afterwards.
