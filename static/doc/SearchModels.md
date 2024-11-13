The **Search Models** operation replaces each model in input with a sequence of models.

Each model in input is used as the input of a program given in the recipe, either as facts (the defaults) or as constraints. _Weak constraints should not be included in the program; use the **Optimize** operation._

A unary predicate is decoded as part of the program (default `__base64__/1`).

In addition to the rules of the program, the number of models can be specified (0 for unbounded). An error can be raised if the specified number of models is not produced (if 0, the program is expected to be incoherent).
