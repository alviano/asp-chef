The **@DTDL/Generate** operation creates DTDL models from higher-level specifications.

It supports three modes:

- **LLM**: generate DTDL from a short textual description;
- **Template**: generate a basic interface from a predefined template;
- **Schema**: convert a JSON Schema or OpenAPI-like object definition into DTDL.

In LLM mode, the operation extracts entities from the description, applies ASP-based checks, generates DTDL JSON, validates it, and reports the result.
Template and Schema modes produce DTDL directly without requiring an existing parsed model.

The output includes:

- the generated DTDL JSON;
- validation feedback;
- quality or constraint notes when available.

Generated content can be downloaded as JSON.
LLM mode requires an OpenRouter-compatible API key provided through `__llms_config__`.

§§§§

Use **@DTDL/Generate** when you want to bootstrap a new digital twin model.

Example prompts:

- `Create a temperature and humidity sensor with a calibration command`
- `Build a smart valve actuator with open and close commands`
