import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const outputDirectory = "dist/client";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const textExtensions = new Set([".html", ".rsc", ".js", ".css", ".json"]);

async function rewriteAssetPaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const filePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await rewriteAssetPaths(filePath);
        return;
      }

      if (!textExtensions.has(extname(entry.name)) && entry.name !== "_headers") {
        return;
      }

      const source = await readFile(filePath, "utf8");
      const updated = source.replace(
        /(^|[^A-Za-z0-9._~-])\/assets\//g,
        `$1${basePath}/assets/`,
      );

      if (updated !== source) {
        await writeFile(filePath, updated);
      }
    }),
  );
}

await rewriteAssetPaths(outputDirectory);
await writeFile(join(outputDirectory, ".nojekyll"), "");
