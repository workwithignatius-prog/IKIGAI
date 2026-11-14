// Bundles the shared engine + the Apps Script entry points into google-apps-script/Code.gs.
// Run: npm run build:gas   (the test suite fails if Code.gs is out of date)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['public/js/questions.js', 'public/js/engine.js', 'public/js/cognitive.js', 'google-apps-script/src/main.js'];
export const OUT = join(root, 'google-apps-script', 'Code.gs');

const strip = (code) =>
  code
    .replace(/^import .*?;\s*$/gm, '')
    .replace(/^export \{[^}]*\};\s*$/gm, '')
    .replace(/^export (const|function|async function|class) /gm, '$1 ');

export function buildGas() {
  const parts = SOURCES.map((f) => `// ══════════ ${f} ══════════\n${strip(readFileSync(join(root, f), 'utf8')).trim()}\n`);
  return `/**
 * IKIGAI — Google Apps Script backend (Google Sheet + cognitive engine)
 *
 * GENERATED FILE — do not edit by hand. Edit the sources listed below and run \`npm run build:gas\`.
 * Setup: see README → "Google Sheet & AI engine setup".
 */

${parts.join('\n')}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(OUT, buildGas());
  console.log(`Wrote ${OUT}`);
}
