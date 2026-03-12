The **Output Encoded Content** operation shows the encoded content in each model in input.

The input is echoed in output.

§§§§

This operation decodes and displays Base64-encoded content found within specific atoms. It is primarily used for debugging or previewing intermediate results that are stored in an encoded format.

#### How it works

The operation looks for atoms matching the specified `predicate` (default: `__base64__`). It assumes the first term of the atom is a Base64-encoded string.
It then decodes this string and displays it in a read-only code editor within the ingredient's UI.

#### UI Controls

- **Height**: Adjust the height of the display container to accommodate long content.
- **Echo**: If set to true, the original encoded atoms are kept in the model. If false (default), they are filtered out from the output model to keep it clean.

#### Common Use Cases

1.  **Inspecting Generated Programs**: If you use **Encode**, **Pack Program**, or **Predicate to Constants** to build an ASP program, use **Output Encoded Content** to verify the resulting text before passing it to a solver.
2.  **Previewing Data**: Decodes and shows the content of data fetched from external sources like GitHub or npm before further processing.

