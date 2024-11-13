The **Reify Program** operation extends each model in input with the given rules, and _reify_ the resulting programs.

Reification is obtained by running `clingo` with `--output=reify`.

A unary predicate is decoded as part of the program (default `__base64__/1`).
