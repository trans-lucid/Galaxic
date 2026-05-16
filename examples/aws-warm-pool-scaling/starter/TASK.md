# Task: Reduce Worker Scale-Out Latency With An ASG Warm Pool

## Context

The worker fleet in this repo handles bursty image-processing jobs. Each VM
takes several minutes to install dependencies and become ready. During sudden
traffic spikes, cold scale-out misses the target response window.

Your job is to improve the IaC so the fleet can keep pre-initialized capacity
ready while still scaling down safely.

## Requirements

Update `infra/opentofu/main.tf` so the generated repo passes `npm test`.

The implementation should:

- keep two active baseline workers
- allow burst scale-out to at least six workers
- set a health-check grace period long enough for slow boot
- enable capacity rebalance
- add an Auto Scaling warm pool using stopped instances
- keep at least two warmed workers prepared
- reuse instances on scale-in
- add a launch lifecycle hook for slow bootstrap
- add queue-depth scale-out and scale-in policies
- connect high/low queue-depth alarms to those policies

## Commands

```bash
npm test
npm run readiness
```

No production credentials are needed. The public tests validate the IaC shape
locally and do not call AWS.
