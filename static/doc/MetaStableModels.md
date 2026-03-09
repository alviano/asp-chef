The **Meta Stable Models** operation extends models in input with some encoded meta programming encoding.

The meta encoding can be used to compute stable models of a reified program (see the **Reify Program** operation).

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

Encoding from https://teaching.potassco.org/meta/

§§§§

This operation provides the logic rules necessary to solve a logic program that has been turned into facts (reified).

#### What is Meta-Solving?

Standard solving involves Clingo taking a program and finding its stable models. Meta-solving involves writing a "meta-program" in ASP that takes the description of another program (as facts like `rule(...)`, `atom(...)`) and reasons about its stable models.

#### How it works

1.  **Reify**: Use the **Reify Program** operation to turn your logic rules into facts.
2.  **Meta Stable Models**: Add this ingredient to inject the rules that define the stable model semantics into your model.
3.  **Search Models**: Solve the combined model. The meta-rules will "interpret" the reified facts and find the stable models of the *original* program.

#### Use Case: Meta-Reasoning and Transformations

Meta-solving is powerful when you want to reason about the properties of a program itself, or when you want to modify a program dynamically using ASP rules before solving it.

By using **Meta Stable Models**, you can find the stable models of your reified program without having to un-reify it first.

