The **Generate CSV** operation maps constants to facts.

Each constant value `v` in row `r` and column `c` is mapped to fact `__cell__(r,c,v).`

The name of the ternary predicate `__cell__` can be specified in the recipe.

§§§§

This operation is useful when you want to output data in a structured tabular format (CSV) from a set of facts.

#### How it works

The operation takes all facts matching the `input_predicate` (default: `__cell__`).
Each fact must be of arity 3: `__cell__(row, col, value)`.
- `row` and `col` must be integers (1-based).
- `value` is any term.

It then organizes these values into a grid and generates a CSV string.

#### Configuration

*   **Separator:** Choose between `TAB`, `SPACE`, or a custom character (like `,` or `;`).
*   **Encode Predicate:** The resulting CSV string is Base64-encoded and wrapped in this predicate (default: `__base64__`).
*   **Echo Input:** If true, all original facts in the model are kept; otherwise, only the newly generated Base64 fact is in the output model.

#### Example

Input model:
```asp
__cell__(1, 1, "Name").
__cell__(1, 2, "Age").
__cell__(2, 1, "Alice").
__cell__(2, 2, 30).
```

With `separator` set to `,` and `encode_predicate` set to `csv_data`, the output will be:
```asp
csv_data("TmFtZSxBZ2UKQWxpY2UsMzA=").
```
(where `TmFtZSxBZ2UKQWxpY2UsMzA=` is the Base64 encoding of `Name,Age\nAlice,30`).

