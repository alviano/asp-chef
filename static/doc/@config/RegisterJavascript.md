The **@config/Register Javascript** operation adds operations to the local storage of the browser.

New operations can be fetched from a remote URL, from multiple remote URLs stored in a given predicate, or from Base64-encoded terms. The code must adhere to the **Javascript** operation (providing name and doc).

HackMD and GitHub URLs are rewritten to their public counterparts. The input is forwarded to the next ingredient.

**Important!** Button REGISTER must be clicked. The new operations are available in the **Operations** panel after a refresh or after modifying the filter, also for other recipes.

Note that this operation is intended as a way to configure and customize ASP Chef. **It is strongly suggested to register new operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.**

§§§§

This operation allows you to extend ASP-chef with custom logic written in JavaScript.

#### How to Register

You can register code in three ways:
1.  **Direct URL**: Provide a URL to a `.js` file (e.g., from GitHub).
2.  **Dynamic URLs**: Provide a predicate name (via the `url` option) that contains Base64-encoded URLs.
3.  **Local Code**: Provide a predicate name (default: `__local__`) containing the Base64-encoded JavaScript source code itself.

#### The JavaScript Format

The registered script must follow the same format as the **Javascript** operation. It should be a standalone function that handles an `input` (array of models) and `options`.

Crucially, to support proper UI documentation in the sidebar, your code should handle the `"DESCRIBE"` option:
```javascript
if (options === "DESCRIBE") {
    return {
        name: "MyCustomOp",
        doc: "Documentation for my operation",
        options: ["option1|number|10|1"]
    };
}
// normal execution...
```

#### Prefixing

Use the `prefix` option to group your custom operations in the sidebar (e.g., using `prefix: "my-tools"` will make the operation appear as `&js-my-tools/OperationName`).

