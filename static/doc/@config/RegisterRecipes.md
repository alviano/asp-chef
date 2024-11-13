The **@config/Register Recipes** operation adds operations to the local storage of the browser.

New operations are given in predicate `__base64__` (it can be changed). Each Base64-encoded atom must provide a name in the first line, a URL in the second line, a space-separated list of predicates (to be remapped) in the third line, and an optional (but strongly suggested) documentation in the remaining lines (Markdown can be used). The **Encode** operation can be used to pack data for a new Recipe operation.

URLs are not rewritten (and will not work if they are not ASP Chef recipes). URLs can be short links (expanded at running time, so to essentially have automatic updates).

The input is forwarded to the next ingredient.

**Important!** Button REGISTER must be clicked. The new operations are available in the **Operations** panel after a refresh or after modifying the filter, also for other recipes.

Note that this operation is intended as a way to configure and customize ASP Chef. **It is strongly suggested to register new operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.**
