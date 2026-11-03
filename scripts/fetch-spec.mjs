import { readFileSync, writeFileSync } from 'node:fs';
import { buildOperations, serialize } from './operations.mjs';

const SOURCE = process.env.GPX_SPEC_URL ?? 'https://api-docs.gpx.co/public-api-v1.yaml';
const SPEC = new URL('../openapi/public-api-v1.yaml', import.meta.url);
const checkOnly = process.argv.includes('--check');

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error(`GET ${SOURCE} returned ${response.status}`);
  process.exit(1);
}
const live = await response.text();

if (!checkOnly) {
  writeFileSync(SPEC, live);
  console.log(`openapi/public-api-v1.yaml updated from ${SOURCE}. Run npm run generate next.`);
  process.exit(0);
}

// Scribe invents new examples on every engine build, so the files never match byte for
// byte; the tools generated from them do, because generation drops examples.
const committed = serialize(buildOperations(readFileSync(SPEC, 'utf8')));
if (serialize(buildOperations(live)) !== committed) {
  console.error(`The tools generated from ${SOURCE} differ from the committed snapshot. Run npm run spec:update, then npm run generate, and release.`);
  process.exit(1);
}
console.log(`The committed snapshot matches ${SOURCE}`);
