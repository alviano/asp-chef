The **Optimize** operation replaces each model in input with a sequence of models.

Each model in input is used as the input of a program given in the recipe, either as facts (the defaults) or as constraints. An optimization function is expected to be specified by means of weak constraints. Costs are mapped to the predicate `__costs__` (as a tuple).

A unary predicate is decoded as part of the program (default `__base64__/1`).

In addition to the rules of the program, the number of models can be specified (0 for unbounded). An error can be raised if the specified number of models is not produced (if 0, the program is expected to be incoherent).

§§§§

This operation is used to find "best" models based on cost functions defined via **Weak Constraints**.

#### Weak Constraints and Optimization

ASP programs use weak constraints to express preferences. A weak constraint has the form:
```asp
:~ target_literal. [weight@level, terms]
```
The solver attempts to minimize the sum of weights of satisfied weak constraints, prioritizing higher levels first.

#### Tracking Costs

The **Optimize** ingredient automatically calculates the cost associated with each level of optimization and adds it to the resulting model using the `__costs__` predicate (default name).
```asp
__costs__(Level1_Weight, Level2_Weight, ...).
```
This is extremely useful for verifying that your optimization is working as intended or for displaying the "value" of a solution in a **Table** or **Markdown** component.

#### Behavioral Sequence

When running an **Optimize** operation, the solver may produce a sequence of models, each better than the previous one, until the optimal one is found (if the number of models is set to `0`).

#### Using with Optimization Strategy

For complex problems, you can use the **Set Optimization Strategy** ingredient before **Optimize** to choose different solver algorithms (like branch-and-bound or unsatisfiable core analysis) to speed up the process.

