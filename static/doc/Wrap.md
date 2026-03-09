The **Wrap** operation considers the elements in input as terms of a unary predicate.

Each model in input is mapped to a model comprising facts of the form
```asp
__atom__(ATOM).
```
where `ATOM` is an atom in the model.

The name of the unary predicate `__atom__` can be specified in the recipe.

§§§§

This operation "reifies" individual atoms, literal-wrapping them into a single term.

#### Why Use Wrap?

Wrapping is the inverse of **Unwrap**. It allows you to treat entire ASP atoms as data that can be passed as arguments to other predicates.

If you have:
```asp
person(john, 25).
```
The **Wrap** operation turns it into:
```asp
__atom__(person(john, 25)).
```

#### Use Cases

1.  **Shielding from Operations**: Some operations (like **Intersection** or **Union**) process atoms based on their predicate names. By wrapping them in `__atom__`, you can prevent them from being processed while still carrying the data through the pipeline.
2.  **Meta-Reasoning**: You can write rules that analyze wrapped atoms:
    ```asp
    is_person(ID) :- __atom__(person(ID, _)).
    ```
3.  **Namespace Management**: You can wrap atoms to "namespace" them before merging models, avoiding predicate name collisions.

#### Predicate Customization

You can change the name of the wrapper predicate (default: `__atom__`) to anything that fits your logic (e.g., `extracted`, `source_data`).

