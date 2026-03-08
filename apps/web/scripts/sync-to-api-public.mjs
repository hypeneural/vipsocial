import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, "../dist");
const targetDir = path.resolve(__dirname, "../../api/public");
const skippedEntries = new Set([".htaccess", "sw.ts"]);

async function sync() {
  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (skippedEntries.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    await cp(sourcePath, targetPath, {
      recursive: entry.isDirectory(),
      force: true,
    });
  }
}

sync().catch((error) => {
  console.error("Failed to sync admin build to apps/api/public.");
  console.error(error);
  process.exitCode = 1;
});
