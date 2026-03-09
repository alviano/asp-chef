The **Sort by Increasing Size** operation sorts the models in input by increasing size.

Models with less atoms will come first.

§§§§

This operation is helpful when you want to find the simplest or most minimal solutions among a set of models.

#### How it works

The operation counts the number of atoms in each model and reorders them starting from the model with the fewest atoms.

#### Use Cases

*   **Minimal Solutions**: In problems where a smaller number of atoms often represents a "simpler" or more efficient solution (e.g., finding the shortest path expressed as a set of atoms).
*   **Focusing on Core Facts**: Quickly identifying models that satisfy constraints with the least amount of data.

#### Tip: Finding the Absolute Minimum

Follow this operation with a **Select Model** ingredient (index 1) to isolate only the smallest model from your results.

