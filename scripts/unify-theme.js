#!/usr/bin/env node
/**
 * One-off codemod: unify every screen onto the single ENDOD palette defined in
 * src/lib/theme.ts and the `brand.*` Tailwind tokens.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

// Hex literals -> canonical palette value.
const HEX = [
  ["#f6f9fa", "#FCF9F3"], // cool page background -> brand bg
  ["#f0eee8", "#F6F3ED"], // cool card fill -> warm surfaceAlt
  ["#ebe1da", "#F6F3ED"],
  ["#e0bfbc", "#E1BFBC"], // border typo
  ["#1f1b17", "#1C1C18"],
  ["#4c4641", "#59413F"],
  ["#756e68", "#8D706E"],
  ["#18242b", "#1C1C18"], // cold blue-black -> brand heading
  ["#1f2124", "#1C1C18"],
  ["#383a42", "#423238"],
  ["#6e7179", "#59413F"],
  ["#46545b", "#59413F"],
  ["#dce4e6", "#E1BFBC"], // cool border -> brand border
  ["#e1e3e8", "#E1BFBC"],
  ["#f4f7f7", "#F6F3ED"],
  ["#eaf4f1", "#F6F3ED"],
  ["#94a3a8", "#C9BFB9"], // label on the dark health card
  ["#94a3b8", "#8D706E"], // input placeholder
  ["#2b1f22", "#2D2327"],
  // case normalisation
  ["#1c1c18", "#1C1C18"],
  ["#59413f", "#59413F"],
  ["#8d706e", "#8D706E"],
  ["#e1bfbc", "#E1BFBC"],
  ["#f6f3ed", "#F6F3ED"],
  ["#fcf9f3", "#FCF9F3"],
  ["#ba1a1a", "#BA1A1A"],
  ["#ad292f", "#AD292F"],
  ["#2d2327", "#2D2327"],
  ["#ffdad6", "#FFDAD6"],
  ["#ffffff", "#FFFFFF"],
  ["#f5f1ea", "#F5F1EA"],
];

// Tailwind class names -> brand tokens. Longest first so prefixes never clash.
const CLASSES = [
  ["bg-brand-app", "bg-brand-bg"],
  ["bg-app", "bg-brand-bg"],
  ["border-slate-200/80", "border-brand-border"],
  ["border-slate-200", "border-brand-border"],
  ["border-slate-300", "border-brand-border"],
  ["bg-slate-200/80", "bg-brand-alt"],
  ["bg-slate-200", "bg-brand-alt"],
  ["bg-slate-100", "bg-brand-alt"],
  ["bg-slate-50", "bg-brand-alt"],
  ["bg-slate-900", "bg-brand-accent"],
  ["text-slate-900", "text-brand-heading"],
  ["text-slate-600", "text-brand-muted"],
  ["text-slate-500", "text-brand-muted"],
  ["text-slate-300", "text-brand-alt"],
  ["border-emerald-600", "border-brand-primary"],
  ["border-emerald-500", "border-brand-primary"],
  ["border-emerald-400", "border-brand-success"],
  ["border-emerald-200", "border-brand-success"],
  ["bg-emerald-600", "bg-brand-primary"],
  ["bg-emerald-500", "bg-brand-primary"],
  ["bg-emerald-100", "bg-brand-success-soft"],
  ["bg-emerald-50", "bg-brand-success-soft"],
  ["text-emerald-700", "text-brand-success"],
  ["bg-teal-100", "bg-brand-success-soft"],
  ["bg-teal-50", "bg-brand-success-soft"],
  ["text-teal-700", "text-brand-success"],
  ["border-teal-200", "border-brand-success"],
  ["text-rose-500", "text-brand-danger"],
  ["text-rose-700", "text-brand-danger"],
  ["border-rose-400", "border-brand-danger"],
  ["border-rose-200", "border-brand-danger"],
  ["bg-rose-50", "bg-brand-danger-soft"],
  ["bg-rose-400", "bg-brand-danger-soft"],
  ["bg-blue-50", "bg-brand-alt"],
  ["text-blue-700", "text-brand-muted"],
  ["border-blue-200", "border-brand-border"],
  ["bg-amber-400", "bg-brand-accent"],
  ["bg-black", "bg-brand-accent"],
  ["border-black", "border-brand-accent"],
  // micro typography below the legibility floor on low-density screens
  ["text-[7px]", "text-[10px]"],
  ["text-[8px]", "text-[10px]"],
  ["text-[9px]", "text-[11px]"],
  ["text-[10px]", "text-[11px]"],
];

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
})(ROOT);

let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const [from, to] of HEX) {
    after = after.split(from).join(to);
    const upper = from.toUpperCase();
    if (upper !== from) after = after.split(upper).join(to);
  }
  for (const [from, to] of CLASSES) {
    after = after.split(from).join(to);
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log("updated", path.relative(path.join(__dirname, ".."), file));
  }
}
console.log(`\n${changed} file(s) updated.`);
