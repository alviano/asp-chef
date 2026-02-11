The **@DTDL/Analysis** operation runs a structural analysis on a parsed DTDL model and displays the results in a user-friendly report.

The input is expected to contain DTDL facts produced by **@DTDL/Parse** (Base64-encoded in `__base64__` by default).
The analysis program computes statistics, identifies hub interfaces, determines communication paths between interfaces, and detects design issues.

The output is organized into sections:

- **Status banner**: shows whether the model is valid or how many design issues were found.
- **Statistics**: counts of commands, interfaces, properties, relationships, and telemetries.
- **Hub Interfaces**: interfaces with the highest number of outgoing relationships.
- **Communication Paths**: pairs of interfaces that can communicate, with the number of hops (1 = direct relationship, 2+ = transitive).
- **Design Issues**: problems detected in the model (e.g., naming convention violations).

Any predicates not recognized by the above categories are shown in a collapsible "Other" section.

The analysis results can be downloaded in JSON or YAML format.

§§§§

Use **Encode** to store a DTDL definition, then **@DTDL/Parse** to convert it to ASP facts, and finally **@DTDL/Analysis** to obtain the report.

For example, given the vineyard model from the **@DTDL/Parse** documentation, the analysis will produce:

- **Statistics**: 10 commands, 5 interfaces, 23 properties, 8 relationships, 14 telemetries
- **Hub Interfaces**: `VineyardProperty;1` with 3 connections
- **Communication Paths**: e.g., `VineyardProperty;1` can communicate with `VineyardPlot;1` (1 hop), `IrrigationController;1` can communicate with `VineyardPlot;1` (1 and 2 hops)
- **Design Issues**: naming convention violations for interfaces with spaces in their display names (e.g., "Vineyard Property", "Pest Trap")
