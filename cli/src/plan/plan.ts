import type {
  DetectedLanguage,
  DomainProfile,
  EnvironmentPlan,
  LanguageOverlay,
} from "../types.js";
import { mergeRecords, unique } from "../utils/objects.js";
import { requireKnownIds } from "../utils/metadata.js";

const ROLE_DEFAULT_PROFILES: Record<string, string[]> = {
  "backend-api": ["backend-api", "security-readiness"],
  "web-fullstack": ["web-fullstack", "security-readiness"],
  "data-sql": ["data-sql", "security-readiness"],
  "cloud-iac": ["cloud-iac", "security-readiness"],
  "api-contract": ["api-contract", "security-readiness"],
  "supabase-local": ["supabase-local", "security-readiness"],
  "firebase-local": ["firebase-local", "security-readiness"],
  "render-shim": ["render-shim", "security-readiness"],
  "ml-llm-light": ["ml-llm-light", "security-readiness"],
  "design-frontend": ["design-frontend", "security-readiness"],
  "gtm-automation": ["gtm-automation", "security-readiness"],
};

const ROLE_FALLBACK_LANGUAGES: Record<string, string[]> = {
  "backend-api": ["node-typescript", "sql"],
  "web-fullstack": ["node-typescript", "sql"],
  "data-sql": ["sql"],
  "cloud-iac": ["terraform-hcl", "shell-devops"],
  "api-contract": ["node-typescript"],
  "supabase-local": ["node-typescript", "sql"],
  "firebase-local": ["node-typescript"],
  "ml-llm-light": ["python"],
  "design-frontend": ["node-typescript"],
  "gtm-automation": ["node-typescript"],
};

interface BuildPlanInput {
  role: string;
  explicitLanguages?: string[];
  explicitProfiles?: string[];
  detectedLanguages: DetectedLanguage[];
  languageOverlays: Map<string, LanguageOverlay>;
  domainProfiles: Map<string, DomainProfile>;
}

export function buildEnvironmentPlan(input: BuildPlanInput): EnvironmentPlan {
  const profileIds = unique([
    ...(input.explicitProfiles?.length
      ? input.explicitProfiles
      : ROLE_DEFAULT_PROFILES[input.role] ?? [input.role, "security-readiness"]),
  ]);
  requireKnownIds(profileIds, input.domainProfiles, "profile");

  const profiles = profileIds.map((profileId) => input.domainProfiles.get(profileId)!);
  const requiredLanguages = profiles.flatMap((profile) => profile.required_languages ?? []);
  const detectedLanguageIds = input.detectedLanguages.map((language) => language.id);
  const fallbackLanguageIds = ROLE_FALLBACK_LANGUAGES[input.role] ?? [];
  const languageIds = unique([
    ...(input.explicitLanguages?.length
      ? input.explicitLanguages
      : [...detectedLanguageIds, ...fallbackLanguageIds]),
    ...requiredLanguages,
  ]);

  requireKnownIds(languageIds, input.languageOverlays, "language");

  const composeModules = unique([
    "base",
    ...profiles.flatMap((profile) => profile.compose_modules),
  ]);
  const ports = mergeRecords(profiles.map((profile) => profile.ports));
  const env = mergeRecords(profiles.map((profile) => profile.env));
  const commands = {
    start: "npm run env:start",
    dev: "npm run dev",
    test_public: "npm run test",
    ci_local: "npm run ci:local",
    deploy_dry_run: "npm run deploy:dry-run",
    ...mergeRecords(profiles.map((profile) => profile.commands)),
  };

  const credentialPolicy = profiles.some(
    (profile) => profile.credential_policy.production_credentials_allowed,
  )
    ? {
        candidate_credentials: "declared-profile-specific",
        production_credentials_allowed: false,
        credentialed_private_smoke_test_allowed: true,
      }
    : {
        candidate_credentials: "local-only",
        production_credentials_allowed: false,
        credentialed_private_smoke_test_allowed: false,
      };

  return {
    role: input.role,
    languages: languageIds,
    profiles: profileIds,
    compose_modules: composeModules,
    ports,
    env,
    commands,
    credential_policy: credentialPolicy,
    readiness_checks: unique(profiles.flatMap((profile) => profile.readiness_checks)),
    detected_languages: input.detectedLanguages,
    mode: composeModules.includes("localstack") ? "local-cloud" : "dockerized",
  };
}
