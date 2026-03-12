The **Reify Program** operation extends each model in input with the given rules, and _reify_ the resulting programs.

Reification is obtained by running `clingo` with `--output=reify`.

A unary predicate is decoded as part of the program (default `__base64__/1`).

§§§§

This operation is the first step for **Meta-Programming** in ASP. It transforms logic rules into a set of facts that describe those rules.

#### What is Reification?

Normally, rules like `a :- b.` are executed by the solver. Reification turns this rule into data, typically facts like:
- `atom_tuple(0).`
- `atom_tuple(0, 1).`
- `literal_tuple(0).`
- `rule(disjunction(0), normal(0)).`

This "program-as-data" can then be manipulated by other ASP rules.

#### Workflow: The Meta-Programming Pipeline

1.  **Reify Program**: Turn rules into facts.
2.  **Transformation**: Use **Search Models** with your own meta-rules to modify the program (e.g., adding symmetry, projection, or instrumentation).
3.  **Meta-Solving**: Use operations like **Meta Stable Models** or **Meta Classical Models** to solve the resulting reified facts.
4.  **Unreify**: Alternatively, use **Unreify Program** to turn the facts back into readable ASP rules.

#### Decoding Base64

Like many operations, **Reify Program** can decode `__base64__` atoms produced by ingredients like **GitHub** or **Pack Program** and include them in the reification process.

