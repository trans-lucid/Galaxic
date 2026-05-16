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
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3  = var.aws_endpoint_url
    sqs = var.aws_endpoint_url
  }
}

resource "aws_s3_bucket" "artifacts" {
  bucket = var.bucket_name
}

output "bucket_name" {
  value = aws_s3_bucket.artifacts.bucket
}
