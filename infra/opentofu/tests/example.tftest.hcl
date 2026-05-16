run "example_output" {
  command = plan

  assert {
    condition     = output.example == "translucid"
    error_message = "Expected example output to equal translucid."
  }
}
