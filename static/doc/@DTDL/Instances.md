The **@DTDL/Instances** operation fetches digital twin instances from Azure Digital Twins, displays them in an interactive panel, and emits their data as ASP facts.

The operation reads configuration from a predicate produced by **@DTDL/Config** and, optionally, DTDL model facts produced by **@DTDL/Parse** to determine which properties are writable.

The following options are available:

- **predicate_config**: predicate from which to read the ADT configuration (default: `__dtdl_azure_config__`).
- **predicate_dtdl**: predicate containing Base64-encoded DTDL facts produced by **@DTDL/Parse** (default: `__base64__`). Used to identify writable properties.
- **predicate_output**: prefix for output predicates (default: `dtdl_`).

The panel has three tabs:

- **Instances**: table view of all fetched twins, showing `$dtId`, model, and scalar property values.
- **Edit**: form to select a twin and edit its scalar properties. Read-only properties (not declared `writable: true` in the DTDL model) are shown with a lock icon and cannot be modified. Changes are pushed to Azure DT via JSON Patch on clicking **Push to Azure**.
- **Raw ASP**: the ASP facts that would be emitted for the current set of twins.

The input is passed through unchanged. The operation does not automatically fetch twins — press **Refresh** to load or reload twins from Azure Digital Twins.

The output predicates have the following structure:

```asp
dtdl_instance("twinId", "dtmi:example:Model;1").
dtdl_property_value("twinId", "propertyName", value).
dtdl_relationship("sourceId", "relName", "targetId").
```

When **Fetch relationships** is enabled, the component also fetches twin-to-twin relationships from Azure Digital Twins and emits them as `dtdl_relationship/3` facts. Each fact encodes the source twin ID, the relationship name, and the target twin ID.

§§§§

Typical pipeline:

```
@DTDL/Register Azure Key → @DTDL/Config → @DTDL/Parse → @DTDL/Instances
```

Use **@DTDL/Parse** before **@DTDL/Instances** to enable writable-property detection. Without it, all scalar properties will be shown as editable.

After pressing **Refresh**, the `dtdl_instance/2` and `dtdl_property_value/3` facts become available to downstream ingredients. Use **Search Models** or other ingredients to process them with ASP rules.

For example, to find all twins of a specific model:

```asp
target(T) :- dtdl_instance(T, "dtmi:com:example:Thermostat;1").
```
