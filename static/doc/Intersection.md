The **Intersection** operation replaces each model in input with a sequence of _cautious consequences_.

A unary predicate is decoded as part of the program (default `__base64__/1`).

Each model in input is used as the input of a program given in the recipe, and its cautious consequences are computed. _Weak constraints should not be included in the program; use the **Optimize** operation._

§§§§

This operation finds the set of atoms that are true for all models of a given program when combined with the input.

#### How it works

The operation takes the current model as the input program and appends the rules specified in the **Rules** editor.
It then finds ALL stable models of the combined program and extracts only the atoms that appear in *every* model.

#### Examples

Suppose we have an input model `{ a., b. }` and the following rules:
```asp
{ c. }.
d :- a.
```
This program would have two possible stable models:
1.  Model 1: `{ a., b., d. }`
2.  Model 2: `{ a., b., c., d. }`

The cautious consequences (intersection) will be `{ a., b., d. }` as `c.` is only present in one model.

#### Integration with Encoded Content

Like many other operations, **Intersection** can decode and include Base64-encoded strings (often containing rules or facts) into the program it uses.

#### Tip: Using Weak Constraints

If your logic contains weak constraints (e.g., `:~ a. [1@1]`), **Intersection** is *not* the right tool because cautious consequences are computed over *all* stable models, while weak constraints are usually used to select *optimal* ones. Use the **Optimize** operation instead.

