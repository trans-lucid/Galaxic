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
  min_size            = 1
  desired_capacity    = 1
  max_size            = 3
  vpc_zone_identifier = var.private_subnet_ids

  health_check_type         = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.worker.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "galaxic-worker"
    propagate_at_launch = true
  }
}
