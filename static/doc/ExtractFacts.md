The **Extract Facts** operation processes Base64-encoded content and applies a simple regular expression to extract facts.

Due to the used regular expression, atom terms are expected to not include any closed parenthesis.
Predicates of arity 0 are not extracted.
Facts are not necessarily terminated by `.`.

The processed Base64-encoded content is given by the predicate `__base64__/1`, which can be echoed in the output.

The extracted atoms are added to the output.

§§§§

This operation is frequently used when dealing with data coming from external sources (like a file or an API) that might already contain some ASP-like structures but isn't a proper ASP program.

#### How it works

The operation decodes the Base64 string and searches for patterns that look like ASP atoms:
`predicate(term1, term2, ...)`

The internal regular expression used is:
`/\b[_']*[a-z][A-Za-z0-9'_]*\s*\([^)]*\)/g`

#### Limitations

*   **No nested parentheses:** Because it uses a simple regex, terms like `f(g(x))` will not be correctly extracted (the regex stops at the first `)`).
*   **Arity > 0:** Only atoms with parentheses and at least one term (or an empty pair of parentheses) are matched. Constants/atoms without parentheses (e.g., `is_ready.`) are ignored.

#### Error Handling

*   **Block Process:** If set to true, the entire ingredient will stop and fail if any extracted string cannot be parsed as a valid ASP atom.
*   **Raise Error:** If true, errors are reported in the recipe UI. If false, they are shown as temporary snackbar notifications.

#### Example

Input Base64 content (decoded):
`Some text with a fact: person(john, 25). And another one: city(new_york).`

The operation will extract:
`person(john, 25)`
`city(new_york)`
and add them as atoms to the model.

