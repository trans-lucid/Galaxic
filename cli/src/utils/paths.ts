import path from "node:path";
import { fileURLToPath } from "node:url";

export function repoRootFromImportMeta(importMetaUrl: string): string {
  const currentDir = path.dirname(fileURLToPath(importMetaUrl));

  if (currentDir.endsWith(path.join("cli", "dist"))) {
    return path.resolve(currentDir, "../..");
  }

  if (currentDir.endsWith(path.join("cli", "src"))) {
    return path.resolve(currentDir, "../..");
  }

  return path.resolve(currentDir, "..");
}

export function resolvePath(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}
