The **Table** operation shows input models in tables.

Each table comprises one row for each atom in the associated model.

The input is echoed in output.

§§§§

This operation provides a quick and clean tabular view of your ASP models.

#### UI Controls

*   **Search**: Filter the table rows by a search string.
*   **Model Index**: Toggle the display of the model number above each table.
*   **Sort Buttons**: When enabled, provides buttons to add a **Sort** operation to your recipe based on the selected column.

#### Predicates and Arguments

The table automatically detects the arity (number of arguments) of your predicates and creates corresponding columns:
- The first column always contains the **Predicate Name**.
- Subsequent columns (Arg#1, Arg#2, ...) contain the terms of the atom.

If an atom is a simple constant (no arguments), it will only occupy the first column.

