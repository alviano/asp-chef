The **Split** operation reverses the **Merge** operation.

Atoms in input of the form
```asp
__model__(INDEX, ATOM).
```
are mapped to model #`INDEX`.

The name of the binary predicate `__model__` can be specified in the recipe.

The order of models is not necessarily preserved.

§§§§

This operation "unwraps" a set of models that have been merged into a single model, restoring them as distinct entities in the ASP-chef pipeline.

#### Reversing the Merge

When models are merged (e.g., to perform cross-model reasoning), they are usually wrapped in a `__model__(INDEX, ATOM)` structure. **Split** looks for these specific atoms and uses the `INDEX` to group the `ATOM`s back into their original (or new) separate models.

#### How it works

The operation uses an internal ASP search to efficiently group and extract the atoms. For each distinct `INDEX` found in the input, a new model is created in the output stream.

#### Use Case: Grouping by Property

You can use **Split** even if you didn't use **Merge** first. If you have a single model where some atoms are tagged with an identifier:
```asp
__model__(1, person(alice)).
__model__(1, age(30)).
__model__(2, person(bob)).
__model__(2, age(25)).
```
Applying **Split** with the predicate `__model__` will result in two separate models:
- Model 1: `{ person(alice). age(30). }`
- Model 2: `{ person(bob). age(25). }`

