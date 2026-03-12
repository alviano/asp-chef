The **Project Argument** operation drops arguments of the specified index.

§§§§

This operation allows you to simplify your models by removing specific arguments from all atoms.

#### How it works

The operation iterates through every atom in each model. For atoms that have at least as many arguments as the specified **Index**, it removes the term at that position.
- If the index is `1`, the first argument is removed.
- If the index is `2`, the second argument is removed, and so on.

#### Use Case: Fact Simplification

Suppose you have results that include a unique identifier or a timestamp that you no longer need for visualization:
- Input: `person(1, john). person(2, alice).`
- Operation: **Project Argument** with Index `1`.
- Output: `person(john). person(alice).`

#### Data Preparation

Projection is often used before operations like **Unique** or **Intersection**. By removing "noise" arguments (like unique IDs), you can find overlapping data based only on the remaining meaningful terms.

