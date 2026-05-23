#!/usr/bin/env node
/** Clean up duplicate / broken classes from bulk text fix */
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

const REPLACEMENTS = [
  ["dark:border-gray-300 dark:border-gray-600", "dark:border-gray-600"],
  ["dark:border-gray-300 dark:border-white/20", "dark:border-white/20"],
  ["dark:hover:bg-gray-100 dark:bg-white/10", "dark:hover:bg-white/10"],
  ["dark:hover:bg-gray-100 dark:hover:bg-white/10", "dark:hover:bg-white/10"],
  ["placeholder:text-gray-500 dark:text-gray-400", "placeholder:text-gray-400 dark:placeholder:text-white/50"],
  ["text-white/85", "text-gray-600 dark:text-gray-300"],
  ["border-gray-200 dark:border-gray-300 dark:border-gray-600", "border-gray-200 dark:border-white/10"],
  // CardTitle / titles still using bare text-white
  ['CardTitle className="text-xl text-white"', 'CardTitle className="text-xl text-gray-900 dark:text-white"'],
  ['CardTitle className="text-white mb-2"', 'CardTitle className="text-gray-900 dark:text-white mb-2"'],
  ['CardTitle className="text-white"', 'CardTitle className="text-gray-900 dark:text-white"'],
  ['<p className="font-medium text-white"', '<p className="font-medium text-gray-900 dark:text-white"'],
  ['hover:text-white"', 'hover:text-gray-900 dark:hover:text-white"'],
  ["SelectContent className=\"bg-black/30 backdrop-blur-lg border-gray-300 dark:border-gray-600 text-white\"", "SelectContent className=\"bg-white dark:bg-black/30 backdrop-blur-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white\""],
  ["SelectContent className=\"bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-white\"", "SelectContent className=\"bg-white dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white\""],
  ["text-white/55", "text-gray-500 dark:text-gray-400"],
  ["placeholder:text-gray-400 dark:placeholder:text-gray-400 dark:placeholder:text-white/50", "placeholder:text-gray-400 dark:placeholder:text-white/50"],
  ["dark:bg-gray-100 dark:bg-white/10", "dark:bg-white/10"],
  ['DialogTitle className="text-white text-2xl"', 'DialogTitle className="text-gray-900 dark:text-white text-2xl"'],
  ['className="text-lg font-medium mb-2 text-white"', 'className="text-lg font-medium mb-2 text-gray-900 dark:text-white"'],
  ['className="font-semibold mb-2 text-white"', 'className="font-semibold mb-2 text-gray-900 dark:text-white"'],
  ['className="ml-2 font-medium text-white"', 'className="ml-2 font-medium text-gray-900 dark:text-white"'],
  ['className="h-8 w-8 text-white"', 'className="h-8 w-8 text-gray-600 dark:text-gray-300"'],
  ['className="h-12 w-12 mx-auto text-white"', 'className="h-12 w-12 mx-auto text-gray-600 dark:text-gray-300"'],
  ['hover:bg-gray-100 dark:bg-white/10 text-sm text-white"', 'hover:bg-gray-100 dark:hover:bg-white/10 text-sm text-gray-900 dark:text-white"'],
  ['className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:bg-white/10 text-sm text-white"', 'className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/10 text-sm text-gray-900 dark:text-white"'],
  ['<div className="text-sm text-white">', '<div className="text-sm text-gray-900 dark:text-white">'],
  ['border border-gray-200 dark:border-transparent border border-gray-300', 'border border-gray-200 dark:border-gray-600'],
]

let total = 0
for (const file of walk(ROOT)) {
  let content = readFileSync(file, "utf8")
  let n = 0
  for (const [find, replace] of REPLACEMENTS) {
    if (content.includes(find)) {
      const count = content.split(find).length - 1
      content = content.replaceAll(find, replace)
      n += count
    }
  }
  if (n > 0) {
    writeFileSync(file, content)
    total += n
    console.log(`${file.replace(ROOT + "/", "")}: ${n}`)
  }
}
console.log(`Cleanup done: ${total} fixes`)
