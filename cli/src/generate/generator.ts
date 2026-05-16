import fs from "node:fs";
import path from "node:path";
import fsExtra from "fs-extra";
import YAML from "yaml";
import type { DetectionResult, EnvironmentPlan } from "../types.js";
import { validateManifestFiles } from "../validate/manifest.js";

const GENERATED_SCRIPT_NAMES = [
  "candidate-safe-scan.sh",
  "ci-local.sh",
  "deploy-dry-run.sh",
  "dev.sh",
  "doctor.sh",
  "env-reset.sh",
  "env-start.sh",
  "env-stop.sh",
  "preflight.sh",
  "readiness.sh",
  "secret-scan.sh",
  "test-api.sh",
  "test-infra.sh",
  "test-public.sh",
  "test-sql.sh",
];

interface GenerateInput {
  baseRoot: string;
  targetRoot: string;
  sourceRoot?: string;
  plan: EnvironmentPlan;
  detection: DetectionResult;
  force?: boolean;
}

export async function generateEnvironment(input: GenerateInput): Promise<void> {
  await prepareTarget(input);
  await writeDevcontainer(input);
  await writeCompose(input);
  await writeRouting(input);
  await writeGalaxicAssets(input);
  await writeManifests(input);
  await writeCommandContracts(input);
  await writeCandidateReadme(input);
  await writeSafeExamples(input);
  validateGeneratedManifests(input);
}

async function prepareTarget(input: GenerateInput): Promise<void> {
  const targetExists = await fsExtra.pathExists(input.targetRoot);
  const targetEntries = targetExists ? await fsExtra.readdir(input.targetRoot) : [];

  if (targetEntries.length > 0 && !input.force) {
    throw new Error(
      `Target is not empty: ${input.targetRoot}. Pass --force to overwrite generated files.`,
    );
  }

  await fsExtra.ensureDir(input.targetRoot);

  if (input.sourceRoot && path.resolve(input.sourceRoot) !== path.resolve(input.targetRoot)) {
    await fsExtra.copy(input.sourceRoot, input.targetRoot, {
      filter: (sourcePath) => shouldCopySourcePath(input.sourceRoot!, sourcePath),
      overwrite: Boolean(input.force),
      errorOnExist: false,
    });
  }
}

function shouldCopySourcePath(sourceRoot: string, sourcePath: string): boolean {
  const relative = path.relative(sourceRoot, sourcePath);
  if (!relative) {
    return true;
  }

  const blockedParts = new Set([
    ".git",
    "node_modules",
    "dist",
    "coverage",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    ".terraform",
  ]);

  if (relative.split(path.sep).some((part) => blockedParts.has(part))) {
    return false;
  }

  if (path.basename(relative).startsWith(".env")) {
    return false;
  }

  return true;
}

async function writeDevcontainer(input: GenerateInput): Promise<void> {
  const forwardPorts = Object.values(input.plan.ports)
    .filter((port, index, ports) => ports.indexOf(port) === index)
    .sort((left, right) => left - right);

  const devcontainer = {
    name: `Galaxic ${input.plan.role}`,
    image: "mcr.microsoft.com/devcontainers/base:ubuntu",
    features: {
      "ghcr.io/devcontainers/features/common-utils:2": {},
      "ghcr.io/devcontainers/features/docker-in-docker:2": {},
      "ghcr.io/devcontainers/features/github-cli:1": {},
      "ghcr.io/devcontainers/features/node:1": {
        version: "22",
      },
    },
    forwardPorts,
    portsAttributes: Object.fromEntries(
      Object.entries(input.plan.ports).map(([label, port]) => [
        String(port),
        { label: label.replaceAll("_", " ") },
      ]),
    ),
    postCreateCommand: "npm install || true; bash galaxic/scripts/doctor.sh || true",
  };

  await writeJson(path.join(input.targetRoot, ".devcontainer/devcontainer.json"), devcontainer);
}

async function writeCompose(input: GenerateInput): Promise<void> {
  const merged: Record<string, unknown> = {};

  for (const moduleName of input.plan.compose_modules) {
    const modulePath = path.join(input.baseRoot, "compose", `${moduleName}.yml`);
    if (!fs.existsSync(modulePath)) {
      throw new Error(`Missing compose module: ${moduleName}`);
    }

    const parsed = YAML.parse(fs.readFileSync(modulePath, "utf8")) as Record<string, unknown>;
    mergeComposeDocument(merged, parsed);
  }

  await fsExtra.writeFile(
    path.join(input.targetRoot, "compose.galaxic.yml"),
    YAML.stringify(merged, { lineWidth: 100 }),
  );
}

function mergeComposeDocument(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      target[key] = {
        ...(target[key] as Record<string, unknown>),
        ...value,
      };
    } else if (isPlainObject(value)) {
      target[key] = { ...value };
    } else {
      target[key] = value;
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function writeRouting(input: GenerateInput): Promise<void> {
  const templatePath = path.join(input.baseRoot, "routing/Caddyfile.template");
  const outputPath = path.join(input.targetRoot, "routing/Caddyfile");
  await fsExtra.ensureDir(path.dirname(outputPath));
  await fsExtra.copyFile(templatePath, outputPath);
}

async function writeGalaxicAssets(input: GenerateInput): Promise<void> {
  const galaxicRoot = path.join(input.targetRoot, "galaxic");
  await fsExtra.ensureDir(galaxicRoot);
  await fsExtra.ensureDir(path.join(galaxicRoot, "scripts"));

  for (const scriptName of GENERATED_SCRIPT_NAMES) {
    const sourcePath = path.join(input.baseRoot, "scripts", scriptName);
    const targetPath = path.join(galaxicRoot, "scripts", scriptName);
    await fsExtra.copyFile(sourcePath, targetPath);
    await fsExtra.chmod(targetPath, 0o755);
  }

  await fsExtra.copy(
    path.join(input.baseRoot, "security"),
    path.join(galaxicRoot, "security"),
    { overwrite: true },
  );

  await fsExtra.copy(
    path.join(input.baseRoot, "mocks/wiremock"),
    path.join(galaxicRoot, "mocks/wiremock"),
    { overwrite: true },
  );
}

async function writeManifests(input: GenerateInput): Promise<void> {
  const environmentId = `galaxic-${input.plan.role}`;
  const environment = {
    environment_id: environmentId,
    base_repo_version: "0.1.0",
    mode: input.plan.mode,
    candidate_safe: true,
    requires_real_credentials: false,
    detected_languages: input.detection.detected_languages,
    profiles: input.plan.profiles,
    services: input.plan.compose_modules
      .filter((moduleName) => moduleName !== "base")
      .map((moduleName) => ({ id: moduleName })),
    ports: input.plan.ports,
    commands: input.plan.commands,
    credential_policy: input.plan.credential_policy,
    limitations: generatedLimitations(input.plan),
  };

  await writeJson(path.join(input.targetRoot, "galaxic-environment.json"), environment);
  await writeJson(path.join(input.targetRoot, "galaxic-preview.json"), buildPreview(input.plan));
  await writeJson(path.join(input.targetRoot, "galaxic/plan.json"), input.plan);
}

function generatedLimitations(plan: EnvironmentPlan): string[] {
  const limitations = [
    "Candidate mode uses local dummy credentials only.",
    "Private solution and hidden evaluator material are intentionally absent.",
  ];

  if (plan.compose_modules.includes("microcks")) {
    limitations.push("Microcks profile metadata is present; full local Microcks stack is deferred.");
  }

  return limitations;
}

function buildPreview(plan: EnvironmentPlan): { tabs: Array<Record<string, unknown>> } {
  const tabs: Array<Record<string, unknown>> = [];

  if (plan.ports.frontend) {
    tabs.push({
      id: "app",
      label: "App",
      port: plan.ports.frontend,
      kind: "iframe",
      path: "/",
      visibility: "private",
    });
    tabs.push({
      id: "mobile",
      label: "Mobile Preview",
      port: plan.ports.frontend,
      kind: "device-frame",
      device: "iphone-15",
      path: "/",
      visibility: "private",
    });
  }

  if (plan.ports.vite && !plan.ports.frontend) {
    tabs.push({
      id: "vite",
      label: "Vite",
      port: plan.ports.vite,
      kind: "iframe",
      path: "/",
      visibility: "private",
    });
  }

  if (plan.ports.storybook) {
    tabs.push({
      id: "storybook",
      label: "Storybook",
      port: plan.ports.storybook,
      kind: "iframe",
      path: "/",
      visibility: "private",
    });
  }

  if (plan.ports.api) {
    tabs.push({
      id: "api",
      label: "API",
      port: plan.ports.api,
      kind: "iframe",
      path: "/health",
      visibility: "private",
    });
  }

  if (plan.ports.mock_api) {
    tabs.push({
      id: "mock-api",
      label: "Mock API",
      port: plan.ports.mock_api,
      kind: "iframe",
      path: "/health",
      visibility: "private",
    });
  }

  if (plan.ports.router) {
    tabs.push({
      id: "router",
      label: "Local Router",
      port: plan.ports.router,
      kind: "iframe",
      path: "/health",
      visibility: "private",
    });
  }

  return { tabs };
}

async function writeCommandContracts(input: GenerateInput): Promise<void> {
  const packageJsonPath = path.join(input.targetRoot, "package.json");
  const scripts = JSON.parse(
    fs.readFileSync(path.join(input.baseRoot, "templates/package-json-scripts.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  const packageJson = fs.existsSync(packageJsonPath)
    ? (JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>)
    : {
        name: `galaxic-${input.plan.role}`,
        version: "0.1.0",
        private: true,
      };
  const existingScripts = (packageJson.scripts as Record<string, string> | undefined) ?? {};

  if (
    existingScripts.test &&
    existingScripts.test !== scripts.scripts.test &&
    !existingScripts["test:app"]
  ) {
    existingScripts["test:app"] = existingScripts.test;
  }

  if (existingScripts.dev && existingScripts.dev !== scripts.scripts.dev && !existingScripts["dev:app"]) {
    existingScripts["dev:app"] = existingScripts.dev;
  }

  packageJson.scripts = {
    ...existingScripts,
    ...scripts.scripts,
  };

  await writeJson(packageJsonPath, packageJson);
  await fsExtra.writeFile(path.join(input.targetRoot, "Makefile"), buildMakefile());
  await fsExtra.writeFile(path.join(input.targetRoot, ".env.example"), buildEnvExample(input.plan));
}

function buildMakefile(): string {
  return [
    ".PHONY: env-start env-stop env-reset dev test ci-local deploy-dry-run doctor",
    "",
    "env-start:",
    "\tbash galaxic/scripts/env-start.sh",
    "",
    "env-stop:",
    "\tbash galaxic/scripts/env-stop.sh",
    "",
    "env-reset:",
    "\tbash galaxic/scripts/env-reset.sh",
    "",
    "dev:",
    "\tbash galaxic/scripts/dev.sh",
    "",
    "test:",
    "\tbash galaxic/scripts/test-public.sh",
    "",
    "ci-local:",
    "\tbash galaxic/scripts/ci-local.sh",
    "",
    "deploy-dry-run:",
    "\tbash galaxic/scripts/deploy-dry-run.sh",
    "",
    "doctor:",
    "\tbash galaxic/scripts/doctor.sh",
    "",
  ].join("\n");
}

function buildEnvExample(plan: EnvironmentPlan): string {
  return `${Object.entries(plan.env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;
}

async function writeCandidateReadme(input: GenerateInput): Promise<void> {
  const readme = [
    `# Galaxic ${input.plan.role} Environment`,
    "",
    "This generated environment is local-first and safety-checked.",
    "",
    "## Profiles",
    "",
    ...input.plan.profiles.map((profile) => `- ${profile}`),
    "",
    "## Languages",
    "",
    ...input.plan.languages.map((language) => `- ${language}`),
    "",
    "## Start",
    "",
    "```bash",
    "npm run env:start",
    "npm run dev",
    "```",
    "",
    "## Test",
    "",
    "```bash",
    "npm run test",
    "```",
    "",
    "## Local Services",
    "",
    "See `galaxic-environment.json` and `galaxic-preview.json`.",
    "",
  ].join("\n");

  await fsExtra.writeFile(path.join(input.targetRoot, "README.md"), readme);
}

async function writeSafeExamples(input: GenerateInput): Promise<void> {
  if (input.plan.profiles.includes("api-contract") || input.plan.profiles.includes("backend-api")) {
    await copyDirectoryIfMissing(path.join(input.baseRoot, "api"), path.join(input.targetRoot, "api"));
  }

  if (
    input.plan.profiles.includes("data-sql") ||
    input.plan.profiles.includes("backend-api") ||
    input.plan.profiles.includes("web-fullstack")
  ) {
    await copyDirectoryIfMissing(
      path.join(input.baseRoot, "database"),
      path.join(input.targetRoot, "database"),
    );
  }

  if (input.plan.profiles.includes("cloud-iac")) {
    await copyDirectoryIfMissing(path.join(input.baseRoot, "infra"), path.join(input.targetRoot, "infra"));
  }

  await fsExtra.ensureDir(path.join(input.targetRoot, "tests/public"));
  await fsExtra.writeFile(
    path.join(input.targetRoot, "tests/public/README.md"),
    "Public tests belong here. Private evaluator and hidden tests must stay outside candidate-facing material.\n",
  );
  const publicRunPath = path.join(input.targetRoot, "tests/public/run.sh");
  await fsExtra.writeFile(publicRunPath, buildPublicTestScript(input.plan));
  await fsExtra.chmod(publicRunPath, 0o755);
}

function buildPublicTestScript(plan: EnvironmentPlan): string {
  const lines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "",
    "echo \"Running Galaxic public environment checks\"",
    "",
    "require_file() {",
    "  if [ ! -f \"$1\" ]; then",
    "    echo \"Missing required file: $1\"",
    "    exit 1",
    "  fi",
    "}",
    "",
    "require_executable() {",
    "  if [ ! -x \"$1\" ]; then",
    "    echo \"Missing required executable: $1\"",
    "    exit 1",
    "  fi",
    "}",
    "",
    "require_file galaxic-environment.json",
    "require_file galaxic-preview.json",
    "require_file compose.galaxic.yml",
    "require_file package.json",
    "require_executable galaxic/scripts/doctor.sh",
    "require_executable galaxic/scripts/candidate-safe-scan.sh",
    "",
    "node -e \"const fs=require('fs'); const env=JSON.parse(fs.readFileSync('galaxic-environment.json','utf8')); if(!env.candidate_safe) throw new Error('environment must be candidate-safe'); if(env.requires_real_credentials) throw new Error('generated public env must not require real credentials');\"",
    "node -e \"const fs=require('fs'); const preview=JSON.parse(fs.readFileSync('galaxic-preview.json','utf8')); if(!Array.isArray(preview.tabs)) throw new Error('preview tabs must be an array');\"",
    "node -e \"const pkg=require('./package.json'); const required=['env:start','env:stop','env:reset','dev','test','ci:local','deploy:dry-run','doctor']; for (const script of required) { if (!pkg.scripts?.[script]) throw new Error('missing package script ' + script); }\"",
    "",
    "if command -v docker >/dev/null 2>&1; then",
    "  docker compose -f compose.galaxic.yml config >/dev/null",
    "fi",
  ];

  if (plan.profiles.includes("backend-api") || plan.profiles.includes("api-contract")) {
    lines.push(
      "",
      "require_file api/openapi.yaml",
      "require_file galaxic/mocks/wiremock/mappings/health.json",
    );
  }

  if (
    plan.profiles.includes("backend-api") ||
    plan.profiles.includes("web-fullstack") ||
    plan.profiles.includes("data-sql")
  ) {
    lines.push("", "require_file database/migrations/001_init.sql", "require_file database/seeds/seed.sql");
  }

  if (plan.profiles.includes("cloud-iac")) {
    lines.push("", "require_file infra/opentofu/main.tf");
  }

  lines.push(
    "",
    "if node -e \"const pkg=require('./package.json'); process.exit(pkg.scripts?.['test:app'] ? 0 : 1)\"; then",
    "  npm run test:app --silent",
    "fi",
  );

  lines.push("", "echo \"Galaxic public environment checks passed\"", "");
  return lines.join("\n");
}

async function copyDirectoryIfMissing(sourcePath: string, targetPath: string): Promise<void> {
  if (await fsExtra.pathExists(targetPath)) {
    return;
  }

  await fsExtra.copy(sourcePath, targetPath, { overwrite: false });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function validateGeneratedManifests(input: GenerateInput): void {
  const result = validateManifestFiles({
    baseRoot: input.baseRoot,
    environmentPath: path.join(input.targetRoot, "galaxic-environment.json"),
    previewPath: path.join(input.targetRoot, "galaxic-preview.json"),
  });

  if (!result.valid) {
    throw new Error(`Generated manifests failed schema validation:\n${result.issues.join("\n")}`);
  }
}
