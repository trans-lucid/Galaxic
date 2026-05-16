import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";

const repoRoot = path.resolve(process.cwd(), "..");

function readYamlFiles(relativeDir: string): Array<{ file: string; value: any }> {
  const absoluteDir = path.join(repoRoot, relativeDir);
  return fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(absoluteDir, entry.name, "language.yaml");
      const profileFile = path.join(absoluteDir, entry.name, "profile.yaml");
      const resolvedFile = fs.existsSync(file) ? file : profileFile;

      return {
        file: resolvedFile,
        value: YAML.parse(fs.readFileSync(resolvedFile, "utf8")),
      };
    });
}

describe("repository metadata", () => {
  it("keeps language overlays parseable and candidate-safe", () => {
    const languages = readYamlFiles("languages");

    expect(languages.length).toBeGreaterThan(10);
    for (const { file, value } of languages) {
      expect(value.id, file).toEqual(path.basename(path.dirname(file)));
      expect(value.detect, file).toBeTruthy();
      expect(value.test_commands, file).toBeTruthy();
      expect(value.candidate_safe, file).toBe(true);
    }
  });

  it("keeps profiles parseable with local-only credential policy", () => {
    const profiles = readYamlFiles("profiles");

    expect(profiles.length).toBeGreaterThan(5);
    for (const { file, value } of profiles) {
      expect(value.id, file).toEqual(path.basename(path.dirname(file)));
      expect(Array.isArray(value.compose_modules), file).toBe(true);
      expect(value.credential_policy, file).toMatchObject({
        candidate_credentials: "local-only",
        production_credentials_allowed: false,
        credentialed_private_smoke_test_allowed: false,
      });
      expect(Array.isArray(value.readiness_checks), file).toBe(true);
    }
  });

  it("keeps JSON templates parseable", () => {
    const files = [
      "templates/galaxic-environment.json",
      "templates/galaxic-preview.json",
      "preview/galaxic-preview.example.json",
      "schema/galaxic-environment.schema.json",
      "schema/galaxic-preview.schema.json",
      "schema/galaxic-language.schema.json",
      "schema/galaxic-profile.schema.json",
    ];

    for (const file of files) {
      const absolutePath = path.join(repoRoot, file);
      expect(() => JSON.parse(fs.readFileSync(absolutePath, "utf8")), file).not.toThrow();
    }
  });
});
