The **Sort by Decreasing Size** operation sorts the models in input by decreasing size.

Models with more atoms will come first.

§§§§

This operation is particularly useful when you are looking for "richer" or more complex models in a large set of solutions.

#### How it works

The operation counts the number of atoms in each model of the current input stream and reorders the models so that the one with the highest count is presented first.

#### Use Cases

*   **Maximizing Information**: If you are solving a configuration problem and want to see the solutions that include the most features or elements first.
*   **Debugging**: Identifying models that might be over-generating atoms.

#### Tip: Combining with Select Model

If you only care about the largest model found, you can follow this operation with a **Select Model** ingredient set to index 1.

