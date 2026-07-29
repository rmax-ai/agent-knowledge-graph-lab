/**
 * Cleans the .data/ directory — removes all runtime artifacts.
 */
import { rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const dataDir = resolve(process.argv[2] ?? join(import.meta.dirname, "..", ".data"));

if (!existsSync(dataDir)) {
  console.log(`Nothing to clean. ${dataDir} does not exist.`);
  process.exit(0);
}

const force = process.argv.includes("--force") || process.argv.includes("-f");

if (!force) {
  console.log(`This will remove ${dataDir} and all its contents.`);
  console.log("Use --force to skip confirmation.");
  process.exit(0);
}

rmSync(dataDir, { recursive: true, force: true });
console.log(`Removed ${dataDir}`);
