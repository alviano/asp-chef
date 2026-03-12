The **MiniZinc** operation replaces each interpretation in input with a sequence of interpretations.

Each interpretation in input is used as the input of a MiniZinc model given in the recipe.

The `__input__` predicate is passed to MiniZinc. In each atom, the first argument is the name of the variable. For each variable, one atom is expected to provide the type (one of `value`, `array`, `array2d`, and `set`). For a variable of type `value`, its value is provided by another atom. For a variable of type `array`, its values are provided by other atoms (each one giving index and value). For a variable of type `array2s`, its values are provided by other atoms (each one giving indices and value). For a variable of type `set`, its values are provided by other atoms (each one giving either an element, or an interval).

A unary predicate is decoded as part of the MiniZinc model (default `__base64__/1`).

The output is mapped to predicate `__output__`, with the same format used by `__input__`.

The number of solutions can be specified (0 for unbounded).

§§§§

This operation allows you to solve Constraint Satisfaction Problems (CSP) using **MiniZinc** directly from your ASP models.

#### How it works

The operation acts as a bridge between the ASP world and the MiniZinc solver (running in the browser).
1. It translates the facts in your input model (using the `__input__` format) into a MiniZinc data file.
2. It combines this data with the MiniZinc model provided in the editor.
3. It runs the solver and converts the resulting solutions back into ASP facts (using the `__output__` format).

#### The Input Format

To pass a variable `n` with value `10` to MiniZinc:
```asp
__input__(n, type, value).
__input__(n, 10).
```

To pass an array `a` with values `[5, 12]`:
```asp
__input__(a, type, array).
__input__(a, 1, 5).
__input__(a, 2, 12).
```

#### The Output Format

The solver's response is provided in a similar way using the `__output__` predicate. You can then use subsequent **Search Models** or **Table** ingredients to process or visualize these results.

#### Use Case: Hybrid Solving

Use **MiniZinc** when you have sub-problems that are more easily expressed as a CSP (like complex scheduling or numerical constraints) while using ASP for the overall symbolic reasoning.

