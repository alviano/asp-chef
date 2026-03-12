The **@dumbo/Template Documentation** operation provides access to the documentation of all core templates (@dumbo/*).

It is possible to control the height of the ingredient, and to filter the templates so to find the one of interest.

The (Markdown) documentation can be saved in facts to be later passed to LLMs or other operations.

§§§§

This operation is a built-in search and browser for the documentation of all `@dumbo` ASP templates.

#### Why use Template Documentation?

The `@dumbo` collection contains a variety of reusable ASP templates (e.g., matching, flow, shortest paths). Each has its own input and output requirements (predicates). This ingredient allows you to:
- **Search**: Find the template you need by name or keyword.
- **Understand**: Read the Markdown-formatted explanation of what the template does and how it expects its predicates to be named.
- **Inspect**: See the rules that will be injected if you use the template.

#### Feeding LLMs and Meta-Logic

A powerful feature of this operation is its ability to output the documentation as facts:
- **Output Predicate**: The name of the fact added to the model.
- **Content**: The full Markdown documentation of the selected template, Base64-encoded.

By passing this documentation to a **@LLMs/Chat Completion** or a specialized meta-reasoning ingredient, you can make your recipe "aware" of the templates it uses. This can be used to generate explanations or automatically configure an **Apply Template Helper**.

#### UI Controls

*   **Height**: Adjust the display area for comfortable reading.
*   **Filter**: Type part of a template name to narrow down the list.

