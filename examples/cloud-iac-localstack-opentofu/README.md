# Cloud IaC + LocalStack + OpenTofu Example

This example exercises the Galaxic `cloud-iac` path.

It includes:

- OpenTofu-compatible HCL
- a local AWS-like endpoint contract for LocalStack
- an OpenTofu test file
- shell metadata for DevOps detection

Generate around it with:

```bash
npm run build
node ../../cli/dist/index.js create \
  --source . \
  --target ../../tmp/generated-cloud-iac-example \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force
```
