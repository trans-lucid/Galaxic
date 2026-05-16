# Lucy Generation Contract

Lucy must follow this sequence when creating an evaluation environment:

1. Pull recruiter codebase into a safe workspace.
2. Run stack, language, service, CI, and cloud detection.
3. Select language overlays.
4. Select domain profiles.
5. Generate a focused devcontainer.
6. Generate focused Docker Compose.
7. Generate local dummy environment values.
8. Generate mocks, emulators, and shims.
9. Generate preview manifest.
10. Solve the task privately first.
11. Generate public tests.
12. Generate hidden evaluator privately.
13. Generate candidate task text.
14. Run RED/GREEN preflight.
15. Run shortcut negative-control.
16. Run candidate-safe scan.
17. Run secret scan.
18. Write readiness report.
19. Publish only when ready.

Candidate-facing material may include the task prompt, generated environment
files, public tests, local mocks, safe fixtures, local dummy env examples,
candidate README, and preview manifest.

Candidate-facing material must never include the private solution, private
evaluator, hidden tests, real credentials, production `.env` files,
service-account JSON, unrelated company code, or logs with tokens.
