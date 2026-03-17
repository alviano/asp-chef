The **@DTDL/Config** operation injects Azure Digital Twins connection configuration into the ingredient pipeline as ASP facts.

The following options are available:

- **Endpoint**: the Azure Digital Twins instance URL (e.g. `https://myadt.digitaltwins.azure.net`).
- **API Version**: the Azure DT REST API version to use (default: `2023-10-31`).
- **Model Filter**: optional DTMI URI to restrict queries to twins of a specific model (e.g. `dtmi:example:Thermostat;1`). When empty, all twins are fetched.
- **Predicate**: the ASP predicate name used for the configuration facts (default: `__dtdl_azure_config__`).

The operation emits one fact per non-empty configuration value:

```asp
__dtdl_azure_config__(endpoint, "https://myadt.digitaltwins.azure.net").
__dtdl_azure_config__(api_version, "2023-10-31").
__dtdl_azure_config__(model_filter, "dtmi:example:Thermostat;1").
```

These facts are read by **@DTDL/Instances** to connect to Azure Digital Twins.
The input is passed through unchanged; no existing facts are removed.

§§§§

Place **@DTDL/Config** after **@DTDL/Register Azure Key** and before **@DTDL/Instances**:

```
@DTDL/Register Azure Key → @DTDL/Config → [@DTDL/Parse →] @DTDL/Instances
```

If you also use **@DTDL/Parse**, place it between Config and Instances so that the DTDL model facts are available for writable-property detection in the Instances panel.
