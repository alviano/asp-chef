The **Transitive Closure** operation extends models in input with the rules encoding the transitive closure of a predicate.

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

§§§§

This operation is a convenience tool for common reachability and hierarchy problems in ASP.

#### How it works

The operation automatically generates standard recursive ASP rules to compute the transitive closure of a given relation.

If you specify `edge` as the **Predicate** and `path` as the **Closure Predicate**, it will generate:
```asp
path(X, Y) :- edge(X, Y).
path(X, Z) :- edge(X, Y), path(Y, Z).
```
The result is then Base64-encoded so it can be used in a subsequent **Search Models** or **Intersection** operation.

#### Use Case: Graphs and Hierarchies

*   **Network Reachability**: From `link(U, V)`, find all `reachable(U, V)`.
*   **Organizational Charts**: From `manager(Boss, Employee)`, find all `senior(Boss, Admin)`.
*   **Family Trees**: From `parent(X, Y)`, find all `ancestor(X, Z)`.

Instead of writing these recurring rule patterns manually, you can use the **Transitive Closure** ingredient to inject them into your pipeline.

#### Customizing the Rules

- **Predicate**: The existing relation name (the "base" of the closure).
- **Closure Predicate**: The name of the resulting transitive relation.
- **Encode Predicate**: The fact that will wrap the generated rules (e.g., `__program__`).
