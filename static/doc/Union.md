The **Union** operation replaces each model in input with a sequence of _brave consequences_.

A unary predicate is decoded as part of the program (default `__base64__/1`).

Each model in input is used as the input of a program given in the recipe, and its brave consequences are computed. _Weak constraints should not be included in the program; use the **Optimize** operation._

§§§§

This operation finds the set of atoms that are true in **at least one** stable model of a given program when combined with the input.

#### How it works

The operation takes the current model as facts and appends the rules specified in the **Rules** editor.
It then finds ALL stable models of the combined program and extracts only the atoms that appear in *any* of the models.

#### Examples

Suppose we have an input model `{ a., b. }` and the following rules:
```asp
{ c. }.
d :- a.
```
This program would have two possible stable models:
1.  Model 1: `{ a., b., d. }`
2.  Model 2: `{ a., b., c., d. }`

The brave consequences (union) will be `{ a., b., c., d. }` as `c.` is present in at least one model.

#### Integration with Encoded Content

Like many other operations, **Union** can decode and include Base64-encoded strings (often containing rules or facts) into its program before computing consequences.

#### Tip: Brave vs. Cautious Consequences

- **Brave Consequences (Union)**: Atoms true in *some* model.
- **Cautious Consequences (Intersection)**: Atoms true in *all* models.

Use **Union** when you want to explore the "possibility space" of your rules and see all potential facts that *could* be true.

