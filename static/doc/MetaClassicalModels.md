The **Meta Classical Models** operation extends models in input with some encoded meta programming encoding.

The meta encoding can be used to compute classical models of a reified program (see the **Reify Program** operation).

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

Encoding from https://teaching.potassco.org/meta/

§§§§

This operation provides the rules for computing **Classical Models** (also known as SAT models) of an ASP program.

#### Stable vs Classical Models

Standard ASP solving finds stable models, which handle negation-as-failure and circularity in a specific way (minimality of truth). Classical models, on the other hand, treat rules as standard logical implications.

For example, in the program `a :- not b. b :- not a.`, both semantics agree on two models: `{a}` and `{b}`.
However, for `a :- a.`, the stable model is `{}` (empty), while classical logic allows both `{}` and `{a}`.

#### How to use

1.  **Reify Program**: Convert your ASP code into facts.
2.  **Meta Classical Models**: Inject the meta-rules defining classical semantics.
3.  **Search Models**: Solve the reified program under classical logic rules.

#### Use Case: SAT Solving

Use this operation when you want to treat your ASP program as a standard Boolean Satisfiability (SAT) problem, or when you are exploring the relationship between different logical semantics.

