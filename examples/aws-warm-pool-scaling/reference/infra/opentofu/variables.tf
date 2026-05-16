variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "worker_ami_id" {
  type    = string
  default = "ami-1234567890abcdef0"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "private_subnet_ids" {
  type    = list(string)
  default = ["subnet-00000000000000001", "subnet-00000000000000002"]
}
