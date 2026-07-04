import { readFileSync, writeFileSync } from 'fs';
const file = 'src/app/owner/page.tsx';
let c = readFileSync(file, 'utf8');
const reps = [
  ["'&#9989;'",   "'✅'"],
  ["'&#128176;'", "'💰'"],
  ["'&#128175;'", "'💯'"],
  ["'&#127881;'", "'🎉'"],
  ["'&#128640;'", "'🚀'"],
];
let n = 0;
for (const [f, t] of reps) {
  const x = c.split(f).join(t);
  if (x !== c) { n++; c = x; }
}
writeFileSync(file, c, 'utf8');
console.log('Fixed ' + n + ' more entities');
