The **@dumbo/Move Before** operation can be used to reorder the program stored in `__program__`.

One or more _atom patterns_ can be specified. (Each atom pattern is terminated by a dot, as for facts, but may contain variables.) Rules matching (i.e., relaxed unifying with) any given pattern are moved up in the program.

§§§§

This operation allows for the programmatic reordering of ingredients within a recipe.

#### How it works

The **Move Before** ingredient moves a specific operation immediately before another target operation. This is particularly useful in meta-programming scenarios where the order of ingredients must be altered dynamically to ensure the correct execution of the transformation pipeline.

#### Use Cases

*   **Pipeline Optimization**: Ensuring a filtering operation is executed before a computationally intensive one.
*   **Dynamic Workflows**: Adapting the recipe structure based on the presence of certain facts or configurations in the input models.
*   **Dependency Management**: Ensuring a "Store" or "Config" operation is correctly positioned before its data is requested by a "Restore" or dependent operation.

#### Technical Note

The operation identifies ingredients by their IDs or operation names and acts on the internal structure of the current recipe.
