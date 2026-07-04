// Fix HTML entity strings in JSX files (PowerShell breaks UTF-8 on Windows)
// Run with: node fix-entities.mjs
import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/app/owner/page.tsx',
  'src/app/owner/settings-sections.tsx',
];

const replacements = [
  // String-literal HTML entities that React renders as raw text
  ["'&#10004;'",  "'✔'"],
  ['"&#10004;"',  '"✔"'],
  ["'&#9888;'",   "'⚠️'"],
  ['"&#9888;"',   '"⚠️"'],
  ["'&#128465;'", "'🗑'"],
  ['"&#128465;"', '"🗑"'],
  ["'&#9998;'",   "'✏️'"],
  ['"&#9998;"',   '"✏️"'],
  ["'&#128220;'", "'📜'"],
  ['"&#128220;"', '"📜"'],
  ["'&#10007;'",  "'✗'"],
  ['"&#10007;"',  '"✗"'],
  // Also fix the non-string context ones used as icon props
  ["`&#10004; ", "`✔ "],
  ['`&#9888; ',  '`⚠️ '],
  ["`&#128465;`", "`🗑`"],
  // Toast/modal strings
  ["'&#10004; Copied", "'✔ Copied"],
  ["'&#9888; Flagged'", "'⚠️ Flagged'"],
  // Fix garbled middle dot in "PNG, JPG, WebP · max 2 MB"
  ['WebP Â·', 'WebP ·'],
];

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let changed = 0;
  for (const [from, to] of replacements) {
    const next = content.split(from).join(to);
    if (next !== content) { changed++; content = next; }
  }
  writeFileSync(file, content, 'utf8');
  console.log(`✅ ${file} — ${changed} replacements`);
}
