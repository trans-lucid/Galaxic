variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_endpoint_url" {
  type    = string
  default = "http://localhost:4566"
}

variable "bucket_name" {
  type    = string
  default = "galaxic-example-artifacts"
}
