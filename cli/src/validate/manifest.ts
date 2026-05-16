import fs from "node:fs";
import path from "node:path";
import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";

export interface ManifestValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateManifestFiles(input: {
  baseRoot: string;
  environmentPath: string;
  previewPath: string;
}): ManifestValidationResult {
  const issues = [
    ...validateFile({
      schemaPath: path.join(input.baseRoot, "schema/translucid-environment.schema.json"),
      dataPath: input.environmentPath,
    }),
    ...validateFile({
      schemaPath: path.join(input.baseRoot, "schema/translucid-preview.schema.json"),
      dataPath: input.previewPath,
    }),
  ];

  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateFile(input: { schemaPath: string; dataPath: string }): string[] {
  const ajv = new Ajv2020({ allErrors: true });
  const schema = JSON.parse(fs.readFileSync(input.schemaPath, "utf8"));
  const data = JSON.parse(fs.readFileSync(input.dataPath, "utf8"));
  const validate = ajv.compile(schema);

  if (validate(data)) {
    return [];
  }

  return (validate.errors ?? []).map((error: ErrorObject) => {
    const pathLabel = error.instancePath || "/";
    return `${input.dataPath} ${pathLabel} ${error.message ?? "is invalid"}`;
  });
}
