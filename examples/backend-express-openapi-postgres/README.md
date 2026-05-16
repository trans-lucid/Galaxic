# Backend API + OpenAPI + Postgres Example

This example is a small source project used to exercise the Galaxic v0.1
backend path.

It includes:

- a Node API server
- TypeScript metadata for stack detection
- OpenAPI contract files
- Postgres migration and seed files
- built-in Node tests

Generate around it with:

```bash
npm run build
node ../../cli/dist/index.js create \
  --source . \
  --target ../../tmp/generated-backend-example \
  --role backend-api \
  --profiles backend-api,api-contract,security-readiness \
  --force
```
