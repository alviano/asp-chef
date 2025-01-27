The **@LLMs/Config** operation adds to the models in input atoms defining the configuration for LLMs services.

Each configuration parameter is saved in a predicate (default `__llms_config__`) as a key-value pair.
Values are double-quoted strings.

Configuration parameters with no value are not produced in output.
Server type is produced in output only if the server parameter has a value.

Currently supported server types:
- Groq
- Ollama
- OpenAI

The temperature sets the level of "creativity" (i.e., randomness) of the model.
High-temperature implies more randomness.