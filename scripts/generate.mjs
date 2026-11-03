import { readFileSync, writeFileSync } from 'node:fs';
import { buildOperations, serialize } from './operations.mjs';

const SPEC = new URL('../openapi/public-api-v1.yaml', import.meta.url);
const OUT = new URL('../src/generated/operations.json', import.meta.url);
const checkOnly = process.argv.includes('--check');

const generated = serialize(buildOperations(readFileSync(SPEC, 'utf8')));

if (checkOnly) {
  if (generated !== readFileSync(OUT, 'utf8')) {
    console.error('src/generated/operations.json is stale. Run npm run generate.');
    process.exit(1);
  }
  console.log('src/generated/operations.json is up to date');
} else {
  writeFileSync(OUT, generated);
  const operations = JSON.parse(generated);
  console.log(`${operations.length} tools (${operations.filter((o) => o.readOnly).length} read-only) written to src/generated/operations.json`);
}
