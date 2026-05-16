import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import fsExtra from "fs-extra";
import YAML from "yaml";
import { afterEach, describe, expect, it } from "vitest";
import { detectStack } from "../src/detect/detect.js";
import { generateEnvironment } from "../src/generate/generator.js";
import { buildEnvironmentPlan } from "../src/plan/plan.js";
import { loadDomainProfiles, loadLanguageOverlays } from "../src/utils/metadata.js";
import { validateManifestFiles } from "../src/validate/manifest.js";

const repoRoot = path.resolve(process.cwd(), "..");
const languageOverlays = loadLanguageOverlays(repoRoot);
const domainProfiles = loadDomainProfiles(repoRoot);
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fsExtra.remove(tempRoot)));
});

describe("v0.1 CLI flow", () => {
  it("detects Node, Python, SQL, Terraform, and shell evidence", async () => {
    const sourceRoot = await makeTempDir();
    await fsExtra.ensureDir(path.join(sourceRoot, "src"));
    await fsExtra.ensureDir(path.join(sourceRoot, "database/migrations"));
    await fsExtra.ensureDir(path.join(sourceRoot, "infra/opentofu"));
    await fsExtra.writeJson(path.join(sourceRoot, "package.json"), {
      dependencies: {
        express: "^4.19.2",
        typescript: "^5.7.2",
      },
    });
    await fsExtra.writeFile(path.join(sourceRoot, "src/server.ts"), "export const ok = true;\n");
    await fsExtra.writeFile(path.join(sourceRoot, "pyproject.toml"), "[project]\nname = \"demo\"\n");
    await fsExtra.writeFile(path.join(sourceRoot, "app.py"), "print('ok')\n");
    await fsExtra.writeFile(
      path.join(sourceRoot, "database/migrations/001.sql"),
      "select 1;\n",
    );
    await fsExtra.writeFile(path.join(sourceRoot, "infra/opentofu/main.tf"), "output \"x\" { value = 1 }\n");
    await fsExtra.writeFile(path.join(sourceRoot, "scripts.sh"), "echo ok\n");

    const detection = await detectStack(sourceRoot, languageOverlays);
    const detectedIds = detection.detected_languages.map((language) => language.id);

    expect(detectedIds).toContain("node-typescript");
    expect(detectedIds).toContain("python");
    expect(detectedIds).toContain("sql");
    expect(detectedIds).toContain("terraform-hcl");
    expect(detectedIds).toContain("shell-devops");
  });

  it("plans the backend-api role with the expected modules", () => {
    const plan = buildEnvironmentPlan({
      role: "backend-api",
      explicitLanguages: ["node-typescript", "sql"],
      detectedLanguages: [],
      languageOverlays,
      domainProfiles,
    });

    expect(plan.profiles).toEqual(["backend-api", "security-readiness"]);
    expect(plan.compose_modules).toEqual(["base", "postgres", "redis", "wiremock", "caddy"]);
    expect(plan.ports).toMatchObject({
      api: 8080,
      mock_api: 8081,
      router: 8088,
      postgres: 5432,
      redis: 6379,
    });
    expect(plan.credential_policy.production_credentials_allowed).toBe(false);
  });

  it("generates a focused candidate repo", async () => {
    const targetRoot = await makeTempDir();
    const plan = buildEnvironmentPlan({
      role: "backend-api",
      explicitLanguages: ["node-typescript", "sql"],
      explicitProfiles: ["backend-api", "api-contract", "security-readiness"],
      detectedLanguages: [],
      languageOverlays,
      domainProfiles,
    });

    await generateEnvironment({
      baseRoot: repoRoot,
      targetRoot,
      plan,
      detection: { source: "", detected_languages: [] },
      force: true,
    });

    expect(fs.existsSync(path.join(targetRoot, ".devcontainer/devcontainer.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetRoot, "compose.translucid.yml"))).toBe(true);
    expect(fs.existsSync(path.join(targetRoot, "translucid/scripts/env-start.sh"))).toBe(true);
    expect(fs.existsSync(path.join(targetRoot, "translucid/mocks/wiremock/mappings/health.json"))).toBe(true);

    const environment = JSON.parse(
      fs.readFileSync(path.join(targetRoot, "translucid-environment.json"), "utf8"),
    );
    expect(environment).toMatchObject({
      candidate_safe: true,
      requires_real_credentials: false,
      profiles: ["backend-api", "api-contract", "security-readiness"],
    });

    const compose = YAML.parse(fs.readFileSync(path.join(targetRoot, "compose.translucid.yml"), "utf8"));
    expect(Object.keys(compose.services)).toEqual(["postgres", "redis", "wiremock", "caddy"]);

    const packageJson = JSON.parse(fs.readFileSync(path.join(targetRoot, "package.json"), "utf8"));
    expect(packageJson.scripts).toMatchObject({
      "env:start": "bash translucid/scripts/env-start.sh",
      test: "bash translucid/scripts/test-public.sh",
      "candidate-safe-scan": "bash translucid/scripts/candidate-safe-scan.sh",
    });

    const validation = validateManifestFiles({
      baseRoot: repoRoot,
      environmentPath: path.join(targetRoot, "translucid-environment.json"),
      previewPath: path.join(targetRoot, "translucid-preview.json"),
    });
    expect(validation).toEqual({ valid: true, issues: [] });
  });
});

async function makeTempDir(): Promise<string> {
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "translucid-cli-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}
