# Warm Pool Scaling Starter

This source repo is intentionally incomplete.

Generate a working Galaxic environment from the parent repository:

```bash
node cli/dist/index.js create \
  --source examples/aws-warm-pool-scaling/starter \
  --target tmp/aws-warm-pool-scaling-work \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force
```

Then run:

```bash
cd tmp/aws-warm-pool-scaling-work
npm test
```

Fix `infra/opentofu/main.tf` until the tests pass.
