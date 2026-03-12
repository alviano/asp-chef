The **@DTDL/Query** operation lets you ask questions about a parsed DTDL model in natural language.

The input is expected to contain DTDL facts produced by **@DTDL/Parse**.
The operation uses an LLM configuration provided through `__llms_config__` and translates the request into ASP rules, executes them, and produces both raw facts and a short natural-language answer.

The workflow is:

- write a natural-language query;
- generate an ASP query from the request;
- run the query on the parsed DTDL facts;
- summarize the result in plain language.

The output includes:

- the generated ASP query;
- the resulting ASP facts;
- a concise natural-language answer.

Results can be downloaded in JSON or YAML format.
An OpenRouter-compatible API key is required.

§§§§

Use **Encode** to store a DTDL definition, then **@DTDL/Parse** to convert it to ASP facts, and finally **@DTDL/Query** to explore the model.

Example queries:

- `Find interfaces with writable properties`
- `Show all telemetries with their schemas`
- `Which interfaces can communicate with VineyardPlot?`
