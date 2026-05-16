import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { DomainProfile, LanguageOverlay } from "../types.js";

function readYaml<T>(filePath: string): T {
  return YAML.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readMetadataDirectories<T>(
  repoRoot: string,
  relativeDir: string,
  fileName: string,
): Map<string, T> {
  const root = path.join(repoRoot, relativeDir);
  const result = new Map<string, T>();

  if (!fs.existsSync(root)) {
    return result;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(root, entry.name, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const value = readYaml<T>(filePath);
    result.set(entry.name, value);
  }

  return result;
}

export function loadLanguageOverlays(repoRoot: string): Map<string, LanguageOverlay> {
  return readMetadataDirectories<LanguageOverlay>(repoRoot, "languages", "language.yaml");
}

export function loadDomainProfiles(repoRoot: string): Map<string, DomainProfile> {
  return readMetadataDirectories<DomainProfile>(repoRoot, "profiles", "profile.yaml");
}

export function requireKnownIds<T>(
  values: string[],
  available: Map<string, T>,
  kind: string,
): void {
  const missing = values.filter((value) => !available.has(value));
  if (missing.length > 0) {
    throw new Error(`Unknown ${kind}: ${missing.join(", ")}`);
  }
}
