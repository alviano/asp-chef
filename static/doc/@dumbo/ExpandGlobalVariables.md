The **@dumbo/Expand Global Variables** operation can be used to expand _global safe variables_ of rules in the program stored in `__program__`.

**Attention!** This operation works with one input part.

§§§§

This operation performs the substitution of global variables within models or recipe configurations.

#### How it works

**Expand Global Variables** scans the content of models for placeholders defined as global variables and replaces them with their current values defined in the session context or by previous configuration operations.

#### Use Cases

*   **Centralized Configuration**: Defining constants like `DB_URL` or `API_VERSION` once and propagating them throughout the recipe.
*   **LLM Prompting**: Injecting global parameters into complex prompts before they are sent to the completion server.
*   **Modularity**: Allowing recipes imported as sub-components to adapt to the context of the main recipe using shared variables.

#### Difference with Mustache

Unlike Mustache expansion (used in **Markdown**), global variables are typically resolved at a higher level and can affect not only the visualization but also the operational parameters of other ingredients.

