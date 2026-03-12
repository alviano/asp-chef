The **Interceptor** operation establishes the position of the new ingredients added to the recipe.

The input is forwarded to the next ingredient (like a **Nop** operation).

There can be at most one **Interceptor** ingredient in the recipe. Adding an **Interceptor** ingredient removes any previous **Interceptor** in the recipe. Moreover, the **Interceptor** ingredient is not intercepted (it is always added at a specified index or otherwise at the end of the recipe).

§§§§

This operation is primarily used when you want a specific point in your recipe to "receive" new ingredients that you add through the UI (e.g., from the sidebar or by clicking on an operation).

#### Default Behavior vs Interception

- **Default Behavior:** Normally, when you add a new ingredient, it is appended to the *end* of the recipe.
- **Interception:** When an **Interceptor** is present, any new ingredient added (that isn't set to a specific index) will be inserted *automatically* before the **Interceptor**.

#### Use Case: Recipe Layout Control

This is useful for maintaining a fixed "end" to your recipe (like a series of visualization or output ingredients) while allowing you to easily add more processing steps "in the middle" without manually moving them.

#### Summary

- It acts as an "insertion point marker."
- It behaves like a **Nop** (no operation) on the facts, so it doesn't modify the models.
- It is a UI and recipe management tool more than a data transformer.

