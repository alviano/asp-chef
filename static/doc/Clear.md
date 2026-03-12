The **Clear** operation ignores its input and returns an array with an empty model.

Use this operation to drop any previous computation and restart with an empty input.
You may want to use this operation after a **Store** ingredient to start a new pipeline.

§§§§

This operation acts as a reset button for the data flow within your recipe.

#### How it works

When the execution reaches a **Clear** ingredient, it completely discards all models currently in the pipeline. In their place, it creates a single, empty model `[[]]`. Subsequent ingredients will receive this empty model as their starting point.

#### Use Case: Branching Recipes

The most common use case for **Clear** is in combination with **Store** and **Restore**:
1.  **Logic A**: Generate some results and then **Store** them (ID: `branch_1`).
2.  **Clear**: Reset the pipeline to start fresh.
3.  **Logic B**: Perform a completely different set of operations.
4.  **Restore**: Bring back `branch_1` models to merge with or compare against the current state.

#### Why not just start a new recipe?

Using **Clear** allows you to maintain multiple independent logic chains within a single, shareable ASP-chef recipe. This is helpful for building complex dashboards that visualize different facets of a problem side-by-side.

