#!/usr/bin/env node
/**
 * Fails when a colour is hardcoded outside the palette.
 *
 * Every colour of the app has to come from `src/lib/theme.json` — either as
 * `COLORS.*` in a style or as a `brand-*` class name. A stray hex value is
 * how the screens slowly drift into different colours, so the check keeps the
 * palette of the reference build (ZTE Blade V30) consistent across pages and
 * devices.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const ALLOWED = new Set([path.join(SRC, "lib", "theme.json"), path.join(SRC, "lib", "theme.ts")]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// A colour literal: a hex value right after a quote, a bracket or a paren.
// (A hex in the middle of a sentence is a store number, not a colour.)
const HEX = /["'\[(]\s*(#[0-9A-Fa-f]{3,8})\b/g;
const offenders = [];

for (const file of walk(SRC)) {
  if (ALLOWED.has(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    let match;
    HEX.lastIndex = 0;
    while ((match = HEX.exec(line)) !== null) {
      offenders.push(
        `${path.relative(ROOT, file)}:${index + 1}  ${match[1]}  ${line.trim().slice(0, 90)}`
      );
    }
  });
}

if (offenders.length > 0) {
  console.error(`Found ${offenders.length} hardcoded colour(s). Use COLORS.* or the brand-* classes instead:\n`);
  for (const offender of offenders) console.error(`  ${offender}`);
  process.exit(1);
}

console.log("No hardcoded colours outside src/lib/theme.json.");
