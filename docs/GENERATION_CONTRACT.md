# Generation Contract

Galaxic-generated repositories should follow this sequence:

1. Inspect the source project in a safe workspace.
2. Run stack, language, service, CI, and cloud detection.
3. Select language overlays.
4. Select domain profiles.
5. Generate a focused devcontainer.
6. Generate focused Docker Compose.
7. Generate local dummy environment values.
8. Generate mocks, emulators, and shims.
9. Generate preview manifest.
10. Generate public tests.
11. Generate local command contracts.
12. Run service startup checks.
13. Run candidate-safe scan.
14. Run secret scan.
15. Write readiness report.
16. Publish only when ready.

Generated public material may include task text, environment files, public
tests, local mocks, safe fixtures, local dummy env examples, README content, and
preview metadata.

Generated public material must never include private solutions, private
evaluator code, hidden tests, real credentials, production `.env` files,
service-account JSON, unrelated company code, or logs with tokens.
