The **Wrap** operation considers the elements in input as terms of a unary predicate.

Each model in input is mapped to a model comprising facts of the form
```asp
__atom__(ATOM).
```
where `ATOM` is an atom in the model.

The name of the unary predicate `__atom__` can be specified in the recipe.
