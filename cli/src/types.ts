export type JsonObject = Record<string, unknown>;

export interface LanguageOverlay {
  id: string;
  display_name: string;
  priority?: number;
  detect: {
    files?: string[];
    extensions?: string[];
    dependencies?: string[];
    commands?: string[];
  };
  tools: JsonObject;
  test_commands: {
    preferred?: string[];
    fallback?: string[];
  };
  lint_commands?: string[];
  build_commands?: string[];
  dev_commands?: string[];
  generated_scripts?: Record<string, string>;
  candidate_safe: boolean;
  notes?: string[];
}

export interface DomainProfile {
  id: string;
  display_name: string;
  description: string;
  domains: string[];
  required_languages?: string[];
  optional_languages?: string[];
  compose_modules: string[];
  ports?: Record<string, number>;
  commands: Record<string, string>;
  env?: Record<string, string>;
  credential_policy: {
    candidate_credentials: string;
    production_credentials_allowed: boolean;
    credentialed_private_smoke_test_allowed: boolean;
  };
  readiness_checks: string[];
  notes?: string[];
}

export interface DetectedLanguage {
  id: string;
  confidence: number;
  evidence: string[];
}

export interface DetectionResult {
  source: string;
  detected_languages: DetectedLanguage[];
}

export interface EnvironmentPlan {
  role: string;
  languages: string[];
  profiles: string[];
  compose_modules: string[];
  ports: Record<string, number>;
  env: Record<string, string>;
  commands: Record<string, string>;
  credential_policy: DomainProfile["credential_policy"];
  readiness_checks: string[];
  detected_languages: DetectedLanguage[];
  mode: "dockerized" | "local-cloud";
}

export interface CreateOptions {
  source?: string;
  target: string;
  role: string;
  languages?: string[];
  profiles?: string[];
  force?: boolean;
}
