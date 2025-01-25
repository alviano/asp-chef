The **@LLMs/Config** operation adds to the models in input atoms defining the configuration for LLMs services.

Each configuration parameter is saved in a predicate (default `__llms_config__`) as a key-value pair.
Values are Base64-encoded.

Configuration parameters with no value are not produced in output.