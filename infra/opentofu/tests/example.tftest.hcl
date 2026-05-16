run "example_output" {
  command = plan

  assert {
    condition     = output.example == "galaxic"
    error_message = "Expected example output to equal galaxic."
  }
}
