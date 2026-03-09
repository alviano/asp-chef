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

§§§§

This operation centralizes the setup for all subsequent LLM calls in your recipe. It transforms the UI selections into facts that the **@LLMs/Chat Completion** ingredient can consume.

#### Key Configuration Options

- **Server**: The base URL of the LLM provider (e.g., `https://api.openai.com/v1`).
- **Endpoint**: The specific API path (default: `/chat/completions`).
- **Model**: The specific model identifier (e.g., `gpt-4o`, `llama3-8b-8192`).
- **Temperature**: A value between 0 and 2 (usually) that controls deterministic (0) versus creative (high) output.

#### Resulting Facts

The generated facts look like this:
```asp
__llms_config__(server, "https://api.groq.com/openai/v1").
__llms_config__(server_type, "Groq").
__llms_config__(model, "mixtral-8x7b-32768").
__llms_config__(temperature, "0.7").
```

#### Why use this ingredient?

While you could manually write these facts in an **Encode** ingredient, **@LLMs/Config** provides:
1.  **UI Helpers**: Easy dropdowns and sliders for common settings.
2.  **Validation**: Ensures that settings are correctly formatted for the internal LLM driver.
3.  **Dynamic Swapping**: You can easily swap providers or models for the entire recipe by changing just one ingredient.

