The **Predicate to Constants** operation maps selected facts to constant directives.

Each fact of the form `__const__(name, value)` is mapped to the directive `#const name = value.`

The directives are then Base64-encoded in the predicate `__base64__`, which can be used by subsequent operations such as **Search Models** or **Optimize**.

The name of the predicates `__const__` and `__base64__` can be specified in the recipe.
The predicate `__const__` can be echoed in the output.

§§§§

This operation is useful for dynamically generating constant definitions based on facts present in the models. It bridges the gap between data (facts) and program configuration (directives).

#### How it works

The operation scans each model for atoms matching the `constants_predicate` (default: `__const__`) with exactly two terms.
- The first term is used as the constant name.
- The second term is used as the value.

For example, the fact `__const__(n, 10).` will be transformed into the string `#const n = 10.\n`.

All such strings generated from a model are concatenated, Base64-encoded, and wrapped in the `output_predicate` (default: `__base64__`).

#### Integration with Solver operations

The generated Base64 fact is intended to be used as part of a logic program. In a subsequent **Search Models** or **Optimize** operation, you can include this encoded content to override or define constants.

#### Use Case: Parameterized Programs

Suppose you have a generic ASP program that uses a constant `n` to define a grid size:
```asp
row(1..n). col(1..n).
```
You can use **Predicate to Constants** to set the value of `n` based on preceding logic or input data.

