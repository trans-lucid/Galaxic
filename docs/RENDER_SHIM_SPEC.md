# Render Shim Spec

The render-shim profile validates Render-style configuration locally without
calling the Render API in candidate mode.

It must:

- parse `render.yaml`
- detect web services, workers, cron jobs, databases, and env groups
- convert local-compatible services to Compose services
- inject Render-like local environment values
- validate build command, start command, health route, port binding, and env var
  presence
- provide a fake deploy hook endpoint when useful
- write `render-shim-report.md`

Private automation may optionally run real Render smoke tests only with
explicitly approved credentials.
