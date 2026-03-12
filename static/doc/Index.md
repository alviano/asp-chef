The **Index** operation associates each element of each model with the index of the element in the model.

Each model in input is encoded by a sequence of facts of the form  
`__index__(INDEX, ATOM).`  
where `INDEX` is an identifier for the atom in the model (starting from 1) and `ATOM` is an atom in the model.

The name of the binary predicate `__index__` can be specified in the recipe.

§§§§

This operation "reifies" the atoms in each model, turning them into terms within new facts. This is particularly useful when you need to reason about the position or count of atoms within a model using ASP rules.

#### Why Use Index?

Standard ASP solver output is just a set of atoms. By using **Index**, you transform:
```asp
a. b. c.
```
into:
```asp
__index__(1, a). __index__(2, b). __index__(3, c).
```

#### Advanced Reasoning

Once indexed, you can apply rules to process these atoms. For example, to find the total count of atoms in an indexed model:
```asp
count(N) :- #max{ I : __index__(I, _) } = N.
```

#### Model Search Integration

The operation performs an internal search to generate the new atoms, ensuring that the resulting set of facts is a valid ASP model.

