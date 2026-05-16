run "bucket_name_is_declared" {
  command = plan

  assert {
    condition     = output.environment == "galaxic-cloud-iac"
    error_message = "Expected Galaxic cloud IaC environment output."
  }
}
