The **@DTDL/Debug** operation validates a parsed DTDL model and reports structural errors in a user-friendly format.

The input is expected to contain DTDL facts produced by **@DTDL/Parse** (Base64-encoded in `__base64__` by default).
The debug program checks for common issues and produces a validation report.

The output shows a status banner (green for VALID, red for FAILED) followed by a list of detected errors.
Three types of errors are currently detected:

- **undefined_target**: a relationship references an interface that is not defined in the model.
- **max_multiplicity_exceeded**: a relationship has more instances than its declared `maxMultiplicity`.
- **missing_required_property**: an interface is missing a required property definition.

Each error includes a description and a suggested action.
A **Suggest Fix** button is available next to each error: it uses an LLM (via OpenRouter) to generate a fix suggestion.
An OpenRouter API key must be provided in the Api Key field to use this feature.

The debug results and the LLM suggestions can be downloaded in JSON or YAML format.

§§§§

Use **Encode** to store a DTDL definition, then **@DTDL/Parse** to convert it to ASP facts, and finally **@DTDL/Debug** to validate the model.

For example, if an interface defines a relationship `hasWeatherStation` targeting `dtmi:agriculture:vineyard:WeatherStation;1` but that interface is not included in the model, the debug report will show:

> **ERROR: Relationship 'hasWeatherStation' references undefined interface 'dtmi:agriculture:vineyard:WeatherStation;1'**
> Check DTDL model or add missing interface definition
