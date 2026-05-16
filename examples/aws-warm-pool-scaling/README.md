# AWS Warm Pool Scaling Challenge

This example creates a realistic cloud/IaC problem around long-boot worker
capacity.

The scenario:

An internal image-processing worker fleet takes several minutes to bootstrap.
Cold scale-out is too slow during spikes, but keeping every instance fully
running is wasteful. The environment should model an EC2 Auto Scaling group with
a warm pool, launch bootstrap lifecycle protection, and queue-depth scaling
signals.

The example contains two source variants:

- `starter`: intentionally incomplete. Generate this when you want to experience
  the problem.
- `reference`: a passing implementation used by the smoke test.

## Try The Starter

From the repository root:

```bash
npm run build
node cli/dist/index.js create \
  --source examples/aws-warm-pool-scaling/starter \
  --target tmp/aws-warm-pool-scaling-work \
  --role cloud-iac \
  --profiles cloud-iac,security-readiness \
  --force
cd tmp/aws-warm-pool-scaling-work
npm test
```

The first test run should fail. Edit `infra/opentofu/main.tf` until the public
tests pass.

## What The Tests Expect

- an EC2 launch template with bootstrap user data
- an Auto Scaling group sized for `min = 2`, `desired = 2`, and `max >= 6`
- health-check grace period of at least 10 minutes
- capacity rebalance enabled
- an ASG warm pool using stopped instances
- at least two warmed instances
- reuse on scale-in
- a launch lifecycle hook with a long heartbeat timeout
- scale-out and scale-in policies plus queue-depth alarms

No real AWS credentials are required. The example is local-first and validates
the IaC shape without calling AWS.

## Design References

The challenge is based on the documented EC2 Auto Scaling warm-pool pattern,
where pre-initialized instances reduce scale-out latency for slow-boot
applications. It also checks for launch lifecycle hooks, which are commonly used
to protect bootstrap work before instances accept traffic.

- AWS EC2 Auto Scaling warm pools:
  <https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html>
- AWS EC2 Auto Scaling lifecycle hooks:
  <https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html>
- Terraform AWS provider Auto Scaling group warm-pool examples:
  <https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/autoscaling_group>
