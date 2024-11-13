The **MiniZinc** operation replaces each interpretation in input with a sequence of interpretation.

Each interpretation in input is used as the input of a MiniZinc model given in the recipe.

The `__input__` predicate is passed to MiniZinc. In each atom, the first argument is the name of the variable. For each variable, one atom is expected to provide the type (one of `value`, `array`, `array2d`, and `set`). For a variable of type `value`, its value is provided by another atom. For a variable of type `array`, its values are provided by other atoms (each one giving index and value). For a variable of type `array2s`, its values are provided by other atoms (each one giving indices and value). For a variable of type `set`, its values are provided by other atoms (each one giving either an element, or an interval).

A unary predicate is decoded as part of the MiniZinc model (default `__base64__/1`).

The output is mapped to predicate `__output__`, with the same format used by `__input__`.

The number of solutions can be specified (0 for unbounded).
