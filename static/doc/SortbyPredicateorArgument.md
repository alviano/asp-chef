The **Sort by Predicate or Argument** operation sorts each model in input according to the specified criteria.

If the specified index is 0, atoms are sorted by predicate. Otherwise, atoms are sorted by the term at the specified index.

The order can be ascending (the default) or descending.

Note that a stable sort algorithm is used. Ordering of ties can be specified by adding another {operation} operation (first criteria come after in the recipe).

§§§§

This operation allows for fine-grained control over the internal ordering of atoms within each model. This is especially useful before presenting data in a **Table** or **Generate CSV** ingredient.

#### Sorting by Predicate

When the **Index** is set to `0`, atoms are grouped and ordered alphabetically by their predicate names (e.g., `apple(...)` before `banana(...)`).

#### Sorting by Argument

When the **Index** is greater than `0` (e.g., `1`, `2`, ...), the operation looks at the term at that position within the atom's arguments.
- If the term is a number, it sorts numerically.
- If the term is a string or constant, it sorts alphabetically.

#### Multi-level Sorting

Because the sort is **stable**, you can perform multi-level sorts by stacking multiple **Sort by Predicate or Argument** ingredients. The *last* sort ingredient in the recipe provides the primary sorting criterion.

Example: To sort primarily by **Predicate** and secondarily by **Arg #1**:
1.  Add **Sort** with Index 1 (Secondary).
2.  Add **Sort** with Index 0 (Primary).

