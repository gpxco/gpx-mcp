// Copies raw app.gpx.co screenshots into public/shots. The "Token created" shot holds a real token,
// so its value is painted over here and never reaches the repository; the video draws a masked one.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rawDir = process.argv[2];
if (!rawDir) {
  console.error('Usage: npm run prepare-shots -- <folder with raw screenshots>');
  process.exit(1);
}
const outDir = new URL('../public/shots/', import.meta.url).pathname;
await mkdir(outDir, { recursive: true });

const shots = ['settings', 'api-access', 'create-empty', 'create-filled', 'token-list', 'trackers', 'tracker'];
for (const name of shots) {
  await sharp(path.join(rawDir, `${name}.jpg`)).jpeg({ quality: 92 }).toFile(path.join(outDir, `${name}.jpg`));
}

// Token box in the 1509x812 "Token created" screenshot.
const box = { left: 562, top: 363, width: 384, height: 35 };
const src = sharp(path.join(rawDir, 'token-created.jpg'));
const { data } = await src.clone().extract({ left: box.left - 1, top: box.top + 2, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
const fill = `rgb(${data[0]},${data[1]},${data[2]})`;
const cover = Buffer.from(`<svg width="${box.width}" height="${box.height}"><rect width="100%" height="100%" fill="${fill}"/></svg>`);
await src.composite([{ input: cover, left: box.left, top: box.top }]).jpeg({ quality: 92 }).toFile(path.join(outDir, 'token-created.jpg'));

console.log(`Wrote ${shots.length + 1} screenshots to ${outDir}`);
