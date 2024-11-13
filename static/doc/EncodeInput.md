The **Encode Input** operation extends each model in input with the base64 encoding of the input itself.

If the input comprises a single model, it can be used by **Search Models** and similar operations. If the input comprises multiple models, very likely you are going to use it in a **Decode Input** operation.

The name of the unary predicate `__base64__` used to wrap the base64 content can be specified in the recipe.

The input can be echoed or suppressed.
