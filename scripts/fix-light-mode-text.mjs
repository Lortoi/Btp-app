#!/usr/bin/env node
/**
 * Bulk-fix hardcoded dark-only Tailwind classes for light/dark mode readability.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

const ROOT = join(import.meta.dirname, "../client/src")

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (p.endsWith(".tsx")) acc.push(p)
  }
  return acc
}

/** Longest-first to avoid partial matches */
const REPLACEMENTS = [
  // Card / surface shells
  [
    "bg-black/20 backdrop-blur-xl border border-white/10 text-white",
    "bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
  ],
  [
    "bg-black/20 backdrop-blur-lg border border-white/10 text-white",
    "bg-gray-50 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
  ],
  [
    "bg-black/20 backdrop-blur-md border border-white/10 text-white",
    "bg-gray-50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
  ],
  [
    "bg-black/20 backdrop-blur-xl border-b border-white/10",
    "bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10",
  ],
  [
    "bg-black/20 backdrop-blur-md border border-white/10 rounded-lg",
    "bg-gray-50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-lg",
  ],
  [
    "bg-black/20 backdrop-blur-md border border-white/10 rounded-xl",
    "bg-gray-50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-xl",
  ],

  // Form inputs (long patterns first)
  [
    "bg-black/20 backdrop-blur-md border-white/10 text-white placeholder:text-white/50",
    "bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50",
  ],
  [
    "bg-black/20 border-white/10 text-white placeholder:text-white/50",
    "bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50",
  ],
  [
    "bg-black/20 border-white/10 text-white placeholder:text-white/40",
    "bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40",
  ],
  [
    "bg-black/20 border-white/10 text-white",
    "bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white",
  ],
  [
    "bg-black/20 backdrop-blur-md border-white/10 text-white",
    "bg-gray-50 dark:bg-black/20 backdrop-blur-md border-gray-300 dark:border-white/10 text-gray-900 dark:text-white",
  ],

  // Buttons
  [
    "text-white border-white/20 hover:bg-white/10",
    "text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10",
  ],
  [
    "bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30",
    "bg-gray-100 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/30",
  ],

  // Titles & subtitles
  ["text-2xl font-bold text-white", "text-2xl font-bold text-gray-900 dark:text-white"],
  ["text-3xl font-bold text-white", "text-3xl font-bold text-gray-900 dark:text-white"],
  ["text-xl font-bold text-white", "text-xl font-bold text-gray-900 dark:text-white"],
  ["text-lg font-semibold text-white", "text-lg font-semibold text-gray-900 dark:text-white"],
  ["text-lg font-medium text-white", "text-lg font-medium text-gray-900 dark:text-white"],
  ["text-sm font-medium text-white", "text-sm font-medium text-gray-900 dark:text-white"],
  ["text-sm text-white/70", "text-sm text-gray-600 dark:text-gray-300"],
  ["text-xs text-white/70", "text-xs text-gray-600 dark:text-gray-300"],
  ["text-sm text-white/60", "text-sm text-gray-500 dark:text-gray-400"],
  ["text-xs text-white/60", "text-xs text-gray-500 dark:text-gray-400"],
  ["text-sm text-white/50", "text-sm text-gray-500 dark:text-gray-400"],
  ["text-xs text-white/50", "text-xs text-gray-500 dark:text-gray-400"],
  ["text-white/90", "text-gray-900 dark:text-white"],
  ["text-white/80", "text-gray-600 dark:text-gray-300"],
  ["text-white/70", "text-gray-600 dark:text-gray-300"],
  ["text-white/60", "text-gray-500 dark:text-gray-400"],
  ["text-white/50", "text-gray-500 dark:text-gray-400"],
  ["text-white/40", "text-gray-500 dark:text-gray-400"],

  // Borders & dividers
  ["border-white/20 hover:border-white/30", "border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30"],
  ["border-white/40 bg-white/10", "border-gray-400 dark:border-white/40 bg-gray-100 dark:bg-white/10"],
  ["border-2 border-dashed rounded-lg", "border-2 border-dashed rounded-lg"], // noop anchor
  ["border-t border-white/10", "border-t border-gray-200 dark:border-white/10"],
  ["h-px bg-white/10", "h-px bg-gray-200 dark:bg-white/10"],
  ["h-px w-10 bg-white/10", "h-px w-10 bg-gray-300 dark:bg-gray-600"],
  ["border border-white/10", "border border-gray-300 dark:border-gray-600"],
  ["border-white/10", "border-gray-300 dark:border-gray-600"],
  ["border-white/20", "border-gray-300 dark:border-white/20"],

  // Backgrounds
  ["bg-white/10 border border-white/10", "bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-gray-600"],
  ["bg-white/10", "bg-gray-100 dark:bg-white/10"],
  ["bg-white/5", "bg-gray-50 dark:bg-white/5"],
  ["hover:bg-white/10", "hover:bg-gray-100 dark:hover:bg-white/10"],
  ["hover:bg-white/15", "hover:bg-gray-200 dark:hover:bg-white/15"],

  // Dropdowns / overlays
  [
    "bg-black/80 backdrop-blur-xl overflow-hidden",
    "bg-white dark:bg-black/80 backdrop-blur-xl overflow-hidden border border-gray-200 dark:border-transparent",
  ],
  [
    "bg-black/90 backdrop-blur-xl",
    "bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-transparent",
  ],

  // Labels (common pattern)
  ['Label className="text-white"', 'Label className="text-gray-900 dark:text-white"'],
  ['className="text-white"', 'className="text-gray-900 dark:text-white"'],

  // Remaining bare text-white (after opacity variants handled)
  [" text-white ", " text-gray-900 dark:text-white "],
]

/** Skip files/patterns where white text on colored bg is intentional */
const SKIP_PATTERNS_IN_LINE = [
  /bg-violet|bg-orange|bg-green|bg-red|bg-blue|bg-\[#|backgroundColor|from-blue|to-purple|gradient/,
  /text-white dark:text-white/,
  /dark:text-white/,
]

function shouldSkipLine(line, find) {
  if (find === 'className="text-gray-900 dark:text-white"') {
    return SKIP_PATTERNS_IN_LINE.some((re) => re.test(line))
  }
  return false
}

let totalChanges = 0
for (const file of walk(ROOT)) {
  let content = readFileSync(file, "utf8")
  let fileChanges = 0
  for (const [find, replace] of REPLACEMENTS) {
    if (!content.includes(find)) continue
    const lines = content.split("\n")
    const next = lines
      .map((line) => {
        if (!line.includes(find) || shouldSkipLine(line, find)) return line
        fileChanges++
        return line.replaceAll(find, replace)
      })
      .join("\n")
    content = next
  }
  if (fileChanges > 0) {
    writeFileSync(file, content)
    totalChanges += fileChanges
    console.log(`${file.replace(ROOT + "/", "")}: ${fileChanges} replacements`)
  }
}
console.log(`Done. ${totalChanges} total replacements.`)
