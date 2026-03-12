The **Recipe** operation takes a URL representing another recipe and adds that recipe as an ingredient.

This operation is practically equivalent to copy all ingredients of a recipe into another recipe.

Note that ASP Chef URLs also contains input, as well as flags to encode input and decode output.
Such content is ignored, as well as anything preceding `#`.

The ingredients of the recipe ingredient can be added to the main recipe (explode button). Similarly, some ingredients can be imploded into the recipe ingredient (implode button), actually replacing it.

§§§§

This operation is the fundamental mechanism for **modularity** and **reuse** in ASP-chef. It allows you to build complex systems by nesting logic and visualizations.

#### Composition vs. Flat Recipes

When you add a **Recipe** ingredient, it acts as a black box that processes input models according to its internal steps.
- **Nested**: Keep the recipe as a single ingredient to maintain a clean top-level view.
- **Explode**: If you want to see or modify the individual steps of the sub-recipe within your current recipe, click the **Explode** button. This will "unpack" all its ingredients into the main list.
- **Implode**: You can select a range of ingredients in your current recipe and "implode" them into a single Recipe operation, making your workflow more organized.

#### Parameterization

You can pass data into a sub-recipe simply by having it precede the **Recipe** ingredient. The sub-recipe will receive the current models as its "Input".

#### Use Cases

*   **Logic Libraries**: Create a recipe that defines a set of complex ASP rules and reuse it across multiple projects.
*   **Dashboards**: Build a standard visualization (e.g., a specific Chart.js layout) and pull it into different recipes to visualize different datasets.
*   **Shared Collaborations**: Link to a recipe hosted on a URL (like a shared link) to ensure you are always using the latest version of a logic module.

