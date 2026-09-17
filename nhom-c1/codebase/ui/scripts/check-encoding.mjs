import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [join(root, "index.html")];

async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (/\.(?:ts|tsx|css|html)$/.test(entry.name)) files.push(path);
  }
}

await collect(join(root, "src"));
const broken = /\uFFFD|Ã|áº|á»|Ä‘|Æ°|â€|[\u0080-\u009F]/u;
for (const file of files) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/);
  const index = lines.findIndex((line) => broken.test(line));
  if (index >= 0) {
    console.error(`Broken text encoding in ${file}:${index + 1}`);
    process.exitCode = 1;
  }
}
