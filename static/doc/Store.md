The **Store** operation stores input in memory.

The ID of the ingredient is associated with the input and can be restored later by the **Restore** operation.

§§§§

This operation acts as a "named checkpoint" in your recipe, allowing you to save the current state of models and retrieve them later, even after they have been modified by intermediate ingredients.

#### How it works

When the recipe execution reaches a **Store** ingredient, it takes the current set of models and saves them in a global memory map using the ingredient's unique **ID**.

#### Usage Scenario: Branching and Merging

1.  **Store**: Save the results of an initial computation (ID: `initial_facts`).
2.  *Process A*: Perform several operations that transform the data into a specific format.
3.  **Restore**: Retrieve the `initial_facts`. Since **Restore** can be configured to echo the current input, you can effectively "join" the current state with the stored state.

#### Interaction with Restore

Place a **Store** ingredient early in your recipe. Later, add a **Restore** ingredient and paste the **ID** from the **Store** ingredient (available in its UI via a copy-to-clipboard button). This creates a non-linear data flow within your recipe.
