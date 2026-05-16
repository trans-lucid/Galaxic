terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
}

resource "aws_launch_template" "worker" {
  name_prefix   = "galaxic-worker-"
  image_id      = var.worker_ami_id
  instance_type = var.instance_type

  user_data = filebase64("${path.module}/scripts/bootstrap-worker.sh")
}

resource "aws_autoscaling_group" "worker" {
  name                = "galaxic-worker-asg"
  min_size            = 2
  desired_capacity    = 2
  max_size            = 8
  vpc_zone_identifier = var.private_subnet_ids

  health_check_type         = "EC2"
  health_check_grace_period = 900
  capacity_rebalance        = true

  launch_template {
    id      = aws_launch_template.worker.id
    version = "$Latest"
  }

  initial_lifecycle_hook {
    name                 = "wait-for-worker-bootstrap"
    lifecycle_transition = "autoscaling:EC2_INSTANCE_LAUNCHING"
    heartbeat_timeout    = 900
    default_result       = "ABANDON"
  }

  warm_pool {
    pool_state                  = "Stopped"
    min_size                    = 2
    max_group_prepared_capacity = 6

    instance_reuse_policy {
      reuse_on_scale_in = true
    }
  }

  tag {
    key                 = "Name"
    value               = "galaxic-worker"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "galaxic-worker-scale-out"
  autoscaling_group_name = aws_autoscaling_group.worker.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 2
  cooldown               = 120
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "galaxic-worker-scale-in"
  autoscaling_group_name = aws_autoscaling_group.worker.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
}

resource "aws_cloudwatch_metric_alarm" "queue_depth_high" {
  alarm_name          = "galaxic-worker-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn]
}

resource "aws_cloudwatch_metric_alarm" "queue_depth_low" {
  alarm_name          = "galaxic-worker-queue-depth-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 10
  alarm_actions       = [aws_autoscaling_policy.scale_in.arn]
}
