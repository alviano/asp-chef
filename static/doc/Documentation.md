The **Documentation** operation provides access to the documentation of all operations.

It is possible to control the height of the ingredient, and to filter the operations so to find the one of interest.

The (Markdown or HTML) documentation can be saved in facts to be later passed to LLMs or other operations.

§§§§

This operation is primarily used for help and exploration within the recipe editor, but it can also be used as a source of information for automated agents or for generating reports about the recipe itself.

#### Integration with LLMs

By setting an `output_predicate` (e.g., `operation_doc`), the documentation for each operation (optionally filtered) will be Base64-encoded and wrapped in that predicate for each model.

Example output:
```asp
operation_doc("RG9jdW1lbnRhdGlvbiBmb3IgRGVjb2RlIElucHV0...").
operation_doc("RG9jdW1lbnRhdGlvbiBmb3IgRW5jb2Rl...").
```

These facts can then be passed to an LLM operation (like **@LLMs/ChatCompletion**) to allow the AI to understand the capabilities of the available ASP-chef operations and help with recipe construction.

#### Filtering

The `filter` option accepts a regular expression. Use it to limit the output to specific operations:
- `^@` – matches all operations in a namespace (e.g., `@LLMs`, `@dumbo`)
- `Input` – matches all operations containing "Input" in their name.

#### HTML vs Markdown

The documentation can be retrieved as raw Markdown (default) or as rendered HTML (by setting the `html` option to true). When using `output_predicate`, the content will be encoded accordingly.

