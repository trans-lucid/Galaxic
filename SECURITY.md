# Security Policy

This repository is public infrastructure for generating evaluation
environments.

Never commit:

- real API keys
- production credentials
- service-account JSON
- raw `.env` files
- recruiter or candidate data
- company source code
- hidden tests
- private solutions
- evaluator internals
- logs containing tokens

All generated candidate repositories must pass:

- candidate-safe path checks
- secret scanning
- profile-specific readiness checks

Candidate mode must be local-first and credential-free unless a manifest
explicitly declares otherwise. Credentialed tests belong only in private
evaluator or Translucid control-plane contexts.
