The **Encode** operation extends models in input with some encoded content (usually rules or configuration).

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

§§§§

This operation is a fundamental building block in ASP-chef. It allows you to inject rules, data, or configuration into each model in the pipeline.

#### Examples

##### 1. Configuration for Visualization
Many visualization operations (like **Billboard.js**, **Chart.js**, **TreeSpider**) use Base64-encoded JSON to configure their settings. You can use **Encode** with the expected predicate (e.g., `__chart__` or `__tree__`) and provide the JSON configuration:
```json
{
  "tree_data": [ ... ],
  "tree_type": "cellar"
}
```

##### 2. Logic Programs for Search
Operations like **Search Models** require a Base64-encoded ASP program. Use **Encode** with the predicate `__program__` and write your rules:
```asp
reachable(X, Y) :- edge(X, Y).
reachable(X, Z) :- edge(X, Y), reachable(Y, Z).
```

#### Editor Support
The ingredient provides a code editor where you can paste your content. You can also specify a language (JavaScript, JSON, Python) for syntax highlighting within the editor.

#### Dynamic Generation
If you need to generate the content dynamically based on the current facts, consider using an operation that supports **Mustache templates** inside the encoded content, as many of the visualization operations do.

