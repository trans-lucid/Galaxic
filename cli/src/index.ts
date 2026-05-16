#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { detectStack } from "./detect/detect.js";
import { generateEnvironment } from "./generate/generator.js";
import { buildEnvironmentPlan } from "./plan/plan.js";
import type { DetectionResult, EnvironmentPlan } from "./types.js";
import { loadDomainProfiles, loadLanguageOverlays } from "./utils/metadata.js";
import { parseCsv } from "./utils/objects.js";
import { repoRootFromImportMeta, resolvePath } from "./utils/paths.js";
import { validateManifestFiles } from "./validate/manifest.js";

const baseRoot = repoRootFromImportMeta(import.meta.url);
const languageOverlays = loadLanguageOverlays(baseRoot);
const domainProfiles = loadDomainProfiles(baseRoot);

const program = new Command();

program
  .name("translucid-env")
  .description("Generate Translucid evaluation environments")
  .version("0.1.0");

program
  .command("detect")
  .description("Detect languages, frameworks, services, CI, and cloud hints")
  .option("--source <dir>", "source repository to inspect", ".")
  .option("--json", "print machine-readable JSON")
  .action(async (options: { source: string; json?: boolean }) =>
    withCliErrors(async () => {
      const detection = await detectStack(resolvePath(options.source), languageOverlays);
      printResult(detection, Boolean(options.json), formatDetection);
    }),
  );

program
  .command("plan")
  .description("Select language overlays and domain profiles")
  .option("--source <dir>", "source repository to inspect", ".")
  .option("--role <role>", "target role profile", "backend-api")
  .option("--languages <ids>", "comma-separated language ids")
  .option("--profiles <ids>", "comma-separated profile ids")
  .option("--json", "print machine-readable JSON")
  .action(
    async (options: {
      source: string;
      role: string;
      languages?: string;
      profiles?: string;
      json?: boolean;
    }) =>
      withCliErrors(async () => {
        const detection = await detectStack(resolvePath(options.source), languageOverlays);
        const plan = buildPlanFromOptions(options.role, detection, {
          languages: parseCsv(options.languages),
          profiles: parseCsv(options.profiles),
        });
        printResult(plan, Boolean(options.json), formatPlan);
      }),
  );

program
  .command("generate")
  .description("Generate devcontainer, compose, preview, env, README, and scripts")
  .requiredOption("--target <dir>", "target directory for generated repo")
  .option("--role <role>", "target role profile", "backend-api")
  .option("--languages <ids>", "comma-separated language ids")
  .option("--profiles <ids>", "comma-separated profile ids")
  .option("--force", "allow writing into a non-empty target")
  .option("--json", "print machine-readable JSON")
  .action(
    async (options: {
      target: string;
      role: string;
      languages?: string;
      profiles?: string;
      force?: boolean;
      json?: boolean;
    }) =>
      withCliErrors(async () => {
        const detection: DetectionResult = { source: "", detected_languages: [] };
        const plan = buildPlanFromOptions(options.role, detection, {
          languages: parseCsv(options.languages),
          profiles: parseCsv(options.profiles),
        });

        await generateEnvironment({
          baseRoot,
          targetRoot: resolvePath(options.target),
          plan,
          detection,
          force: options.force,
        });

        printResult(
          { target: resolvePath(options.target), plan },
          Boolean(options.json),
          ({ target }) => `Generated ${target}`,
        );
      }),
  );

program
  .command("create")
  .description("Detect, plan, and generate an evaluation repo")
  .requiredOption("--target <dir>", "target directory for generated repo")
  .option("--source <dir>", "source repository to copy and inspect")
  .option("--role <role>", "target role profile", "backend-api")
  .option("--languages <ids>", "comma-separated language ids")
  .option("--profiles <ids>", "comma-separated profile ids")
  .option("--force", "allow writing into a non-empty target")
  .option("--json", "print machine-readable JSON")
  .action(
    async (options: {
      target: string;
      source?: string;
      role: string;
      languages?: string;
      profiles?: string;
      force?: boolean;
      json?: boolean;
    }) =>
      withCliErrors(async () => {
        const sourceRoot = options.source ? resolvePath(options.source) : undefined;
        const detection = sourceRoot
          ? await detectStack(sourceRoot, languageOverlays)
          : { source: "", detected_languages: [] };
        const plan = buildPlanFromOptions(options.role, detection, {
          languages: parseCsv(options.languages),
          profiles: parseCsv(options.profiles),
        });

        await generateEnvironment({
          baseRoot,
          targetRoot: resolvePath(options.target),
          sourceRoot,
          plan,
          detection,
          force: options.force,
        });

        printResult(
          { target: resolvePath(options.target), detection, plan },
          Boolean(options.json),
          ({ target, plan: generatedPlan }) =>
            `Generated ${target}\nProfiles: ${generatedPlan.profiles.join(", ")}\nLanguages: ${generatedPlan.languages.join(", ")}`,
        );
      }),
  );

program
  .command("preflight")
  .description("Run local preflight checks")
  .option("--cwd <dir>", "directory to run preflight in", ".")
  .action((options: { cwd: string }) =>
    withCliErrors(async () => {
      runScript("scripts/preflight.sh", resolvePath(options.cwd));
    }),
  );

program
  .command("validate")
  .description("Validate Translucid environment and preview manifests")
  .option("--cwd <dir>", "directory containing generated manifests", ".")
  .option("--environment <file>", "environment manifest path", "translucid-environment.json")
  .option("--preview <file>", "preview manifest path", "translucid-preview.json")
  .option("--json", "print machine-readable JSON")
  .action(
    (options: { cwd: string; environment: string; preview: string; json?: boolean }) =>
      withCliErrors(async () => {
        const cwd = resolvePath(options.cwd);
        const result = validateManifestFiles({
          baseRoot,
          environmentPath: path.resolve(cwd, options.environment),
          previewPath: path.resolve(cwd, options.preview),
        });

        printResult(
          result,
          Boolean(options.json),
          (value) =>
            value.valid
              ? "Translucid manifests are valid"
              : `Translucid manifests are invalid:\n${value.issues.join("\n")}`,
        );

        if (!result.valid) {
          process.exitCode = 1;
        }
      }),
  );

program
  .command("readiness")
  .description("Write readiness report")
  .option("--cwd <dir>", "directory to write the report in", ".")
  .action((options: { cwd: string }) =>
    withCliErrors(async () => {
      runScript("scripts/readiness.sh", resolvePath(options.cwd));
    }),
  );

program
  .command("render-shim")
  .description("Parse render.yaml and generate local deployment shim")
  .action(() => {
    console.log("Render shim generation is scheduled after the first backend/full-stack slice.");
  });

program.parse(process.argv);

function buildPlanFromOptions(
  role: string,
  detection: DetectionResult,
  options: { languages?: string[]; profiles?: string[] },
): EnvironmentPlan {
  return buildEnvironmentPlan({
    role,
    explicitLanguages: options.languages,
    explicitProfiles: options.profiles,
    detectedLanguages: detection.detected_languages,
    languageOverlays,
    domainProfiles,
  });
}

async function withCliErrors(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`translucid-env: ${message}`);
    process.exitCode = 1;
  }
}

function printResult<T>(
  value: T,
  asJson: boolean,
  formatter: (value: T) => string,
): void {
  if (asJson) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(formatter(value));
  }
}

function formatDetection(detection: DetectionResult): string {
  if (detection.detected_languages.length === 0) {
    return `No language overlays detected in ${detection.source}`;
  }

  return [
    `Detected language overlays in ${detection.source}:`,
    ...detection.detected_languages.map(
      (language) => `- ${language.id} (${language.confidence}): ${language.evidence.join("; ")}`,
    ),
  ].join("\n");
}

function formatPlan(plan: EnvironmentPlan): string {
  return [
    `Role: ${plan.role}`,
    `Profiles: ${plan.profiles.join(", ")}`,
    `Languages: ${plan.languages.join(", ")}`,
    `Compose modules: ${plan.compose_modules.join(", ")}`,
    `Mode: ${plan.mode}`,
  ].join("\n");
}

function runScript(relativeScriptPath: string, cwd: string): void {
  const scriptPath = path.join(cwd, "translucid", relativeScriptPath);
  const fallbackScriptPath = path.join(cwd, relativeScriptPath);
  const resolvedScriptPath = pathExists(scriptPath) ? scriptPath : fallbackScriptPath;
  const result = spawnSync("bash", [resolvedScriptPath], {
    cwd,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status && result.status !== 0) {
    throw new Error(`${relativeScriptPath} failed with exit code ${result.status}`);
  }
}

function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
