The **Merge** operation combines all models in a single model.

Each model in input is encoded by a sequence of facts of the form
```asp
__model__(INDEX).
__model__(INDEX, ATOM).
```
where `INDEX` is an identifier for the model (starting from 1) and `ATOM` is an atom in the model.

The name of the binary predicate `__model__` can be specified in the recipe.
