The **Meta Supported Models** operation extends models in input with some encoded meta programming encoding.

The meta encoding can be used to compute supported models of a reified program (see the **Reify Program** operation).

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

Encoding from https://teaching.potassco.org/meta/

§§§§

This operation provides the rules for computing **Supported Models**—a semantics where atoms must be justified by at least one rule, but without the strict "no-circular-justification" requirement of stable models.

#### Stable vs Supported Models

- **Stable Models**: Require a well-founded derivation. Circular logic like `a :- b. b :- a.` results in neither being true.
- **Supported Models**: Only require that if an atom is true, at least one of its rules' bodies is true. In the circular case `a :- b. b :- a.`, both `{}` and `{a, b}` are supported models.

#### How to use

1.  **Reify Program**: Convert your ASP code into reified facts.
2.  **Meta Supported Models**: Injects the meta-rules defining supported model semantics.
3.  **Search Models**: Solve the reified program under this alternative semantics.

#### Why Use Supported Models?

Supported models are useful in certain theoretical contexts or when modeling problems where "self-supporting" cycles are acceptable or meaningful for the domain being analyzed.

