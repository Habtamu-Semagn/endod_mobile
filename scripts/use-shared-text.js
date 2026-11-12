#!/usr/bin/env node
/**
 * Points every screen at the shared `Text` component.
 *
 * The wrapper in `src/components/ui/Text.tsx` pins the font scale so that the
 * system font size setting of a phone cannot reflow the design. This script
 * swaps the `Text` import of `react-native` for the wrapper.
 *
 *   node scripts/use-shared-text.js          # apply the rewrite
 *   node scripts/use-shared-text.js --dry    # only report what would change
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const WRAPPER = path.join(SRC, "components", "ui", "Text.tsx");
const DRY = process.argv.includes("--dry");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

function relativeWrapperPath(file) {
  const rel = path.relative(path.dirname(file), WRAPPER).replace(/\.tsx$/, "").split(path.sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

/** Removes `Text` from the named imports of the `react-native` import. */
function stripTextFromReactNativeImport(source) {
  return source.replace(
    /import\s*\{([^}]*)\}\s*from\s*"react-native";/g,
    (match, names) => {
      const kept = names
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name && name !== "Text");
      if (kept.length === names.split(",").map((n) => n.trim()).filter(Boolean).length) return match;
      if (kept.length === 0) return "";
      const oneLine = `import { ${kept.join(", ")} } from "react-native";`;
      if (oneLine.length <= 100) return oneLine;
      return `import {\n${kept.map((name) => `  ${name},`).join("\n")}\n} from "react-native";`;
    }
  );
}

function addWrapperImport(source, file) {
  const importPath = relativeWrapperPath(file);
  const statement = `import { Text } from "${importPath}";`;
  if (source.includes(statement)) return source;

  // Insert after the last top level import statement. A statement can span
  // several lines, so the scan looks for the line that closes it.
  const lines = source.split("\n");
  let insertAt = 0;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^import\b/.test(line)) {
      depth += (line.match(/{/g) || []).length;
      depth -= (line.match(/}/g) || []).length;
      if (depth <= 0) insertAt = i + 1;
    }
  }
  lines.splice(insertAt, 0, statement);
  return lines.join("\n");
}

const files = walk(SRC).filter(
  (file) => file !== WRAPPER && path.basename(file) !== "FittingText.tsx"
);

let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  if (!/<Text[\s>]/.test(original)) continue;

  const importPath = relativeWrapperPath(file);
  const statement = `import { Text } from "${importPath}";`;

  let next = stripTextFromReactNativeImport(original);
  if (!next.includes(statement)) next = addWrapperImport(next, file);
  next = next.replace(/\n{3,}/g, "\n\n");
  if (next === original) continue;

  changed++;
  const rel = path.relative(ROOT, file);
  if (DRY) {
    console.log(`would change: ${rel}`);
  } else {
    fs.writeFileSync(file, next);
    console.log(`rewrote: ${rel}`);
  }
}

console.log(`\n${changed} file(s) ${DRY ? "would be" : "were"} rewritten.`);
