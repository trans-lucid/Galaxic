import fs from "node:fs";
import path from "node:path";
import { globby } from "globby";
import type { DetectedLanguage, DetectionResult, LanguageOverlay } from "../types.js";
import { sortByPriority } from "../utils/objects.js";

const IGNORED_DIRECTORIES = [
  "**/.git/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.venv/**",
  "**/__pycache__/**",
  "**/.terraform/**",
];

interface SourceIndex {
  sourceRoot: string;
  entries: string[];
  files: string[];
  basenames: Set<string>;
  extensions: Map<string, number>;
  packageDependencies: Set<string>;
}

async function buildSourceIndex(sourceRoot: string): Promise<SourceIndex> {
  const entries = await globby(["**/*", ...IGNORED_DIRECTORIES.map((pattern) => `!${pattern}`)], {
    cwd: sourceRoot,
    dot: true,
    onlyFiles: false,
  });

  const files = entries.filter((entry) => {
    const absolutePath = path.join(sourceRoot, entry);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  });

  const basenames = new Set(entries.map((entry) => path.basename(entry)));
  const extensions = new Map<string, number>();

  for (const file of files) {
    const extension = path.extname(file);
    if (!extension) {
      continue;
    }
    extensions.set(extension, (extensions.get(extension) ?? 0) + 1);
  }

  return {
    sourceRoot,
    entries,
    files,
    basenames,
    extensions,
    packageDependencies: readPackageDependencies(sourceRoot),
  };
}

function readPackageDependencies(sourceRoot: string): Set<string> {
  const packageJsonPath = path.join(sourceRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return new Set();
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    return new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

function fileEvidence(index: SourceIndex, pattern: string): string | undefined {
  const normalized = pattern.replace(/^\.\//, "");
  const absolutePath = path.join(index.sourceRoot, normalized);

  if (fs.existsSync(absolutePath)) {
    return `matched path: ${normalized}`;
  }

  if (!normalized.includes("/") && index.basenames.has(normalized)) {
    return `matched file name: ${normalized}`;
  }

  return undefined;
}

function detectLanguage(index: SourceIndex, overlay: LanguageOverlay): DetectedLanguage | undefined {
  const evidence: string[] = [];

  for (const file of overlay.detect.files ?? []) {
    const match = fileEvidence(index, file);
    if (match) {
      evidence.push(match);
    }
  }

  for (const extension of overlay.detect.extensions ?? []) {
    const count = index.extensions.get(extension) ?? 0;
    if (count > 0) {
      evidence.push(`matched extension: ${extension} (${count})`);
    }
  }

  for (const dependency of overlay.detect.dependencies ?? []) {
    if (index.packageDependencies.has(dependency)) {
      evidence.push(`matched package dependency: ${dependency}`);
    }
  }

  if (evidence.length === 0) {
    return undefined;
  }

  const fileMatches = evidence.filter((item) => item.startsWith("matched path")).length;
  const dependencyMatches = evidence.filter((item) => item.includes("dependency")).length;
  const extensionMatches = evidence.filter((item) => item.includes("extension")).length;
  const confidence = Math.min(
    1,
    fileMatches * 0.35 + dependencyMatches * 0.25 + Math.min(extensionMatches, 2) * 0.15,
  );

  return {
    id: overlay.id,
    confidence: Number(confidence.toFixed(2)),
    evidence,
  };
}

export async function detectStack(
  sourceRoot: string,
  languageOverlays: Map<string, LanguageOverlay>,
): Promise<DetectionResult> {
  const index = await buildSourceIndex(sourceRoot);
  const detected = sortByPriority([...languageOverlays.values()])
    .map((overlay) => detectLanguage(index, overlay))
    .filter((result): result is DetectedLanguage => Boolean(result))
    .sort((left, right) => {
      const confidence = right.confidence - left.confidence;
      return confidence === 0 ? left.id.localeCompare(right.id) : confidence;
    });

  return {
    source: sourceRoot,
    detected_languages: detected,
  };
}
