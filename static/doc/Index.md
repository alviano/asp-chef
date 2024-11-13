The **Index** operation associates each element of each model with the index of the element in the model.

Each model in input is encoded by a sequence of facts of the form  
`__index__(INDEX, ATOM).`  
where `INDEX` is an identifier for the atom in the model (starting from 1) and `ATOM` is an atom in the model.

The name of the binary predicate `__index__` can be specified in the recipe.
