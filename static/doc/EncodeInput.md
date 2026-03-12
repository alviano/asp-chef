The **Encode Input** operation extends each model in input with the Base64 encoding of the input itself.

If the input comprises a single model, it can be used by **Search Models** and similar operations. If the input comprises multiple models, very likely you are going to use it in a **Decode Input** operation.

The name of the unary predicate `__base64__` used to wrap the Base64 content can be specified in the recipe.

The input can be echoed or suppressed.

§§§§

This operation captures the current state of the entire logic program (as a set of facts/models) and packages it into a single fact.

#### Use Case: Saving and Restoring State

You can use **Encode Input** to "checkpoint" a program. Later, after more operations have transformed the program, you can use **Decode Input** with the captured Base64 string to return to that earlier point.

#### Search Operations

When working with operations like **Search Models** that expect a program as a Base64-encoded string, **Encode Input** provides a way to turn facts from previous ingredients into the program for that search.

Example workflow:
1.  **Extract Facts**: From an external source.
2.  **Filter**: Keep only some predicates.
3.  **Encode Input**: Wrap the filtered facts into `__program__`.
4.  **Search Models**: Use `__program__` as the logic program to solve.

#### Eco/Suppress Input

- If `echo_input` is **false** (default), the output will be a single model containing only the Base64 atom.
- If `echo_input` is **true**, the Base64 atom is appended to each existing model in the input.

