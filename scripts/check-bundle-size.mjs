/* global console, process */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const distAssetsDirectory = join(process.cwd(), 'dist', 'assets');
const maxChunkBytes = 500 * 1024;

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js')).map((entry) => join(directory, entry.name));
}

try {
  const files = await listJavaScriptFiles(distAssetsDirectory);
  const sizes = await Promise.all(
    files.map(async (file) => ({
      file,
      size: (await stat(file)).size,
    })),
  );
  const oversized = sizes.filter((item) => item.size > maxChunkBytes);

  if (oversized.length > 0) {
    console.error(`Bundle size check failed. Max JS chunk size is ${formatKiB(maxChunkBytes)}.`);
    for (const item of oversized) {
      console.error(`- ${item.file}: ${formatKiB(item.size)}`);
    }
    process.exit(1);
  }

  for (const item of sizes) {
    console.log(`Bundle chunk ${item.file}: ${formatKiB(item.size)}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Bundle size check failed.');
  process.exit(1);
}
