The **@dumbo/Apply Template Helper** operation provides an assistant to apply core templates (@dumbo/*).

The predicates of the selected template can be renamed using the UI of the ingredient, and the fact to apply the template is Base64-encoded the specified output predicate.

The output of this operation can be later used by **@dumbo/Expand Templates** or other ingredients.
Alternatively, the output can be copied in the clipboard and pasted in an **Encode** ingredient (to be subsequently expanded using **@dumbo/Expand Template**).

§§§§

This operation simplifies the process of using complex, reusable ASP templates from the `@dumbo` collection.

#### How it works

Applying a template usually requires writing a specific "trigger" fact that identifies the template and maps its internal predicates to your model's predicates. This helper provides a GUI to do this without manual coding.

1.  **Select a Template**: Choose from the available `@dumbo` templates (e.g., graph algorithms, data transformations).
2.  **Rename Predicates**: The UI lists the "internal" predicates used by the template. You can map them to the predicates already used in your recipe.
3.  **Generate Activation**: The ingredient produces a Base64-encoded fact (default: `__base64__`) that represents this configuration.

#### Integration Workflow

*   **@dumbo/Expand Templates**: Place this ingredient after the helper. It will see the generated activation fact and inject the actual ASP rules of the template into the model.
*   **Manual Copy**: You can copy the generated string and paste it into an **Encode** ingredient if you want to store the template activation statically in your recipe.

#### Use Case: Reusable Logic

Suppose you want to apply a "Symmetry" template to your `edge/2` predicate. Instead of writing the rules manually, use the **Apply Template Helper**, select the symmetry template, map `edge` to the template's input, and let the **Expand Templates** ingredient do the rest.

