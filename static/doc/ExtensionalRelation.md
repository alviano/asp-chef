The **Extensional Relation** operation adds a set of facts (an extensional relation) to each model in the input.

Each provided row in the `instances` editor is mapped to a fact of the specified predicate (defaulting to `__edb__`).

§§§§

This operation is a convenient way to inject a "table" of data into your ASP program without having to write full ASP facts manually.

#### Example: Adding Color Mapping
Suppose you want to add some mapping between fruit names and colors:

1.  Set the **Predicate** to `fruit_color`.
2.  In the **Instances** box, enter:
    ```text
    apple, red
    banana, yellow
    grape, purple
    ```

The operation will automatically generate and append the following facts to each input model:
```asp
fruit_color(apple, red).
fruit_color(banana, yellow).
fruit_color(grape, purple).
```

#### Usage Tips
- Each line in the editor represents one record.
- You don't need to wrap strings in quotes unless they contain special characters or spaces.
- You can provide any number of arguments, separated by commas.
- Because the operation performs a model search internally to combine the new facts with the existing ones, this can be used to resolve any potential conflicts if you have constraints in your rules.
