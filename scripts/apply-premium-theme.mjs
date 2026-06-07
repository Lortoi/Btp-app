#!/usr/bin/env node
/**
 * Applique le thème premium noir/orange sur les classes Tailwind hardcodées.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const ROOT = join(import.meta.dirname, "..", "client", "src")

const REPLACEMENTS = [
  // Violet / purple → orange brand
  [/violet-950/g, "neutral-950"],
  [/violet-900/g, "neutral-900"],
  [/violet-800/g, "neutral-800"],
  [/violet-700/g, "brand"],
  [/violet-600/g, "brand"],
  [/violet-500/g, "brand"],
  [/violet-400/g, "brand-light"],
  [/violet-300/g, "brand-light"],
  [/violet-200/g, "brand-muted"],
  [/violet-100/g, "brand-muted"],
  [/purple-\d+/g, "brand"],
  // Old orange accent
  [/#F97316/g, "#F5A623"],
  [/\borange-500\b/g, "brand"],
  [/\borange-400\b/g, "brand-light"],
  // Surface cards (long pattern)
  [
    /bg-gray-50 dark:bg-gray-800\/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600/g,
    "surface-card backdrop-blur-sm",
  ],
  [
    /bg-gray-50\/95 dark:bg-gray-900\/90 backdrop-blur-xl/g,
    "surface-glass backdrop-blur-sm",
  ],
  [
    /bg-white\/80 dark:bg-black\/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600/g,
    "surface-header backdrop-blur-sm",
  ],
  [
    /bg-white\/85 dark:bg-black\/40 backdrop-blur-xl border-b border-border dark:border-gray-600/g,
    "surface-header backdrop-blur-sm",
  ],
  [
    /bg-white\/80 dark:bg-black\/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600/g,
    "surface-header backdrop-blur-sm",
  ],
  [
    /border-gray-300 dark:border-gray-600/g,
    "border-border",
  ],
  [
    /border-gray-200 dark:border-gray-600/g,
    "border-border",
  ],
  [
    /text-gray-900 dark:text-white/g,
    "text-foreground",
  ],
  [
    /text-gray-600 dark:text-gray-300/g,
    "text-subtitle",
  ],
  [
    /text-gray-500 dark:text-gray-400/g,
    "text-secondary",
  ],
  [
    /hover:bg-gray-100 dark:hover:bg-white\/10/g,
    "hover:bg-white/5",
  ],
  [
    /hover:bg-gray-100 dark:bg-white\/10/g,
    "hover:bg-white/5",
  ],
  [
    /bg-white\/20 backdrop-blur-md border border-gray-300 dark:border-gray-600/g,
    "bg-brand/10 border border-brand/30 shadow-glow-sm",
  ],
]

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== "node_modules") walk(p, files)
    } else if (extname(p) === ".tsx" || extname(p) === ".ts") {
      if (!p.includes("ShaderBackground") && !p.includes("aurora-background")) {
        files.push(p)
      }
    }
  }
  return files
}

let total = 0
for (const file of walk(ROOT)) {
  let content = readFileSync(file, "utf8")
  const original = content
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    writeFileSync(file, content)
    total++
    console.log("updated:", file.replace(ROOT, ""))
  }
}
console.log(`Done. ${total} files updated.`)
