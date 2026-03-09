The **Search Models** operation replaces each model in input with a sequence of models.

Each model in input is used as the input of a program given in the recipe, either as facts (the defaults) or as constraints. _Weak constraints should not be included in the program; use the **Optimize** operation._

A unary predicate is decoded as part of the program (default `__base64__/1`).

In addition to the rules of the program, the number of models can be specified (0 for unbounded). An error can be raised if the specified number of models is not produced (if 0, the program is expected to be incoherent).

§§§§

This operation is the core solver component of ASP-chef. It allows you to execute Answer Set Programming (ASP) logic rules against your current models.

#### How it works

For each model in the input stream, **Search Models** performs the following:
1.  Takes the atoms of the model.
2.  Combines them with the logic rules provided in the ingredient's editor.
3.  Combines them with any decoded Base64 content (e.g., rules fetched from GitHub).
4.  Invokes the Clingo solver.
5.  Replaces the original model with the resulting stable models.

#### Input as Facts vs Constraints

In the ingredient UI, you can toggle how the input model is treated:
- **As Facts (Default)**: Atoms in the input model are treated as a set of facts. Your rules can reason about them directly.
- **As Constraints**: Atoms in the input model are treated as integrity constraints (specifically, their negation). This is useful for "filtering" or checking consistency.

#### Controlling the Number of Models

Use the **Models** option to specify how many stable models you want to find:
- `1`: Find only the first stable model.
- `0`: Find **all** stable models.
- `n`: Find up to `n` stable models.

#### Integration with Encoded Content

If your model contains atoms like `__base64__("...")` (e.g., from a **GitHub** or **Pack Program** ingredient), these are automatically decoded and included as rules in the solver's program. This enables dynamic loading of logic modules.

