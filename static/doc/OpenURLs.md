The **Open URLs** operation adds buttons to open URLs Base64-encoded in predicate `__url__`.

The input is forwarded to the next ingredient.

§§§§

This operation provides a way to interactively open external websites or resources based on the content of your ASP models.

#### How it works

The operation scans each input model for atoms of the specified predicate (default: `__url__`).
1. It decodes the Base64 term found in the atom.
2. It displays a button in the ingredient's UI labeled with the URL or a generic "Open URL" icon.
3. Clicking the button opens the URL in a new browser tab.

#### Use Cases

*   **Deep Linking**: If your logic identifies specific items (like a GitHub issue or a documentation page), use **Open URLs** to provide a direct link for the user to follow.
*   **External Dashboards**: Link to pre-configured visualizations on external sites.
*   **Search Queries**: Generate a Google or Wikipedia search URL within your ASP rules and present it as a button.

#### Tip: Clean Models

Since the input is forwarded to the next ingredient, **Open URLs** acts as a transparent visualization. It doesn't modify the data, so you can place it anywhere in your recipe without breaking subsequent logic.

