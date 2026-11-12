#!/usr/bin/env node
/**
 * Replaces every hardcoded colour literal in `src/` with a brand token.
 *
 *   node scripts/apply-brand-tokens.js          # apply the rewrite
 *   node scripts/apply-brand-tokens.js --dry    # only report what would change
 *
 * The palette itself lives in `src/lib/theme.json`; this script only rewrites
 * the call sites so that a screen can never pick up a colour of its own.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const THEME = path.join(SRC, "lib", "theme.json");
const DRY = process.argv.includes("--dry");

const palette = JSON.parse(fs.readFileSync(THEME, "utf8"));

/** hex -> COLORS key */
const HEX_TO_TOKEN = {};
for (const [key, value] of Object.entries(palette)) {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) HEX_TO_TOKEN[value.toUpperCase()] = key;
}

/** hex -> tailwind brand token (without the `brand-` prefix) */
const HEX_TO_BRAND = {
  "#59413F": "body",
  "#1C1C18": "heading",
  "#8D706E": "muted",
  "#BA1A1A": "danger",
  "#FFDAD6": "danger-soft",
  "#C9BFB9": "on-dark",
  "#94E0C0": "on-dark-accent",
  "#F6F3ED": "alt",
  "#423238": "accent",
  "#2D2327": "accent-deep",
  "#AD292F": "primary",
  "#2E7D5B": "success",
  "#E3F0E9": "success-soft",
  "#E1BFBC": "border",
  "#FCF9F3": "bg",
  "#FFFFFF": "white",
};

/** class prefixes that may carry an arbitrary colour */
const CLASS_PREFIXES = ["text", "bg", "border", "from", "to", "via", "shadow", "outline", "divide", "placeholder", "decoration", "fill", "stroke"];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function relativeThemePath(file) {
  const rel = path.relative(path.dirname(file), THEME).replace(/\.json$/, "").split(path.sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function rewriteClasses(source) {
  return source.replace(
    /([a-zA-Z]+)-\[#[0-9A-Fa-f]{6}\](\/[0-9]+)?/g,
    (match, prefix, opacity) => {
      const hex = match.slice(prefix.length + 2, prefix.length + 9).toUpperCase();
      const brand = HEX_TO_BRAND[hex];
      if (!brand) return match;
      if (!CLASS_PREFIXES.includes(prefix)) return match;
      if (brand === "white") return `${prefix}-white${opacity ?? ""}`;
      return `${prefix}-brand-${brand}${opacity ?? ""}`;
    }
  );
}

function rewriteStyles(source) {
  let out = source;

  // `prop: "#HEX"` inside style objects -> `prop: COLORS.token`
  out = out.replace(/([A-Za-z][A-Za-z0-9]*): "(#[0-9A-Fa-f]{6})"/g, (match, prop, hex) => {
    const token = HEX_TO_TOKEN[hex.toUpperCase()];
    return token ? `${prop}: COLORS.${token}` : match;
  });

  // `prop="#HEX"` -> `prop={COLORS.token}`
  out = out.replace(/([A-Za-z][A-Za-z0-9]*)="#([0-9A-Fa-f]{6})"/g, (match, prop, hex) => {
    const token = HEX_TO_TOKEN[`#${hex.toUpperCase()}`];
    return token ? `${prop}={COLORS.${token}}` : match;
  });

  // bare `"#HEX"` (array entries, ternaries) -> `COLORS.token`
  out = out.replace(/"(#[0-9A-Fa-f]{6})"/g, (match, hex) => {
    if (/(?:color|Color)\s*:\s*"#[0-9A-Fa-f]{6}"/.test(match)) return match;
    const token = HEX_TO_TOKEN[hex.toUpperCase()];
    return token ? `COLORS.${token}` : match;
  });

  return out;
}

function ensureImport(source, file) {
  if (/import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*["'][^"']*lib\/theme["']/.test(source)) return source;
  if (/import\s*\{[^}]*\}\s*from\s*["'][^"']*lib\/theme["']/.test(source)) {
    return source.replace(/import\s*\{([^}]*)\}\s*from\s*(["'][^"']*lib\/theme["'])/, (match, names, from) => {
      return `import { COLORS, ${names.trim()} } from ${from}`;
    });
  }
  const importPath = relativeThemePath(file);
  const lines = source.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, `import { COLORS } from "${importPath}";`);
  return lines.join("\n");
}

const files = walk(SRC).filter((f) => !f.endsWith(path.join("lib", "theme.ts")) && !f.endsWith(path.join("lib", "theme.json")));

let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let next = rewriteClasses(original);
  next = rewriteStyles(next);
  if (next !== original && /\bCOLORS\./.test(next)) next = ensureImport(next, file);
  if (next !== original) {
    changed++;
    const rel = path.relative(ROOT, file);
    if (DRY) {
      console.log(`would change: ${rel}`);
    } else {
      fs.writeFileSync(file, next);
      console.log(`rewrote: ${rel}`);
    }
  }
}

console.log(`\n${changed} file(s) ${DRY ? "would be" : "were"} rewritten.`);
