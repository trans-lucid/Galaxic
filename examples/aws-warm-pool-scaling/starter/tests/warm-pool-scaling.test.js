import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = process.cwd();
const mainTf = fs.readFileSync(path.join(root, "infra/opentofu/main.tf"), "utf8");

function block(resourceType, resourceName) {
  const marker = `resource "${resourceType}" "${resourceName}"`;
  const start = mainTf.indexOf(marker);
  assert.notEqual(start, -1, `Missing ${marker}`);
  const open = mainTf.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < mainTf.length; index += 1) {
    if (mainTf[index] === "{") depth += 1;
    if (mainTf[index] === "}") depth -= 1;
    if (depth === 0) return mainTf.slice(open + 1, index);
  }
  throw new Error(`Could not parse block for ${marker}`);
}

function numberValue(source, key) {
  const match = source.match(new RegExp(`${key}\\s*=\\s*(\\d+)`));
  assert.ok(match, `Missing numeric value for ${key}`);
  return Number(match[1]);
}

test("launch template uses bootstrap user data", () => {
  const launchTemplate = block("aws_launch_template", "worker");
  assert.match(launchTemplate, /user_data\s*=\s*(filebase64|base64encode)\(/);
  assert.match(launchTemplate, /bootstrap-worker\.sh/);
});

test("autoscaling group keeps baseline warm-worker capacity", () => {
  const asg = block("aws_autoscaling_group", "worker");
  assert.equal(numberValue(asg, "min_size"), 2);
  assert.equal(numberValue(asg, "desired_capacity"), 2);
  assert.ok(numberValue(asg, "max_size") >= 6, "max_size should allow burst scale-out");
  assert.ok(
    numberValue(asg, "health_check_grace_period") >= 600,
    "health_check_grace_period should cover slow boot time",
  );
  assert.match(asg, /capacity_rebalance\s*=\s*true/);
});

test("autoscaling group has stopped warm pool with reuse on scale-in", () => {
  const asg = block("aws_autoscaling_group", "worker");
  assert.match(asg, /warm_pool\s*{/);
  assert.match(asg, /pool_state\s*=\s*"Stopped"/);
  assert.ok(numberValue(asg, "min_size") >= 2, "warm pool should keep at least two workers ready");
  assert.match(asg, /instance_reuse_policy\s*{/);
  assert.match(asg, /reuse_on_scale_in\s*=\s*true/);
});

test("launch lifecycle hook protects long bootstrap", () => {
  const asg = block("aws_autoscaling_group", "worker");
  assert.match(asg, /initial_lifecycle_hook\s*{/);
  assert.match(asg, /lifecycle_transition\s*=\s*"autoscaling:EC2_INSTANCE_LAUNCHING"/);
  assert.ok(numberValue(asg, "heartbeat_timeout") >= 600);
});

test("queue depth scaling policies and alarms are declared", () => {
  assert.match(mainTf, /resource\s+"aws_autoscaling_policy"\s+"scale_out"/);
  assert.match(mainTf, /resource\s+"aws_autoscaling_policy"\s+"scale_in"/);
  assert.match(mainTf, /resource\s+"aws_cloudwatch_metric_alarm"\s+"queue_depth_high"/);
  assert.match(mainTf, /resource\s+"aws_cloudwatch_metric_alarm"\s+"queue_depth_low"/);
});
