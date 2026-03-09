The **Filter** operation filters the atoms in input using a regular expression.

Each atom of each model in input is matched against the given pattern. Atoms not matching the pattern are discarded.

§§§§

This operation is useful for isolating a subset of interest from a larger set of atoms, especially before visualization or before passing data to an external tool.

#### Pattern Examples

The filtering is **case-insensitive**.

*   `^p` – matches all atoms starting with the letter 'p'.
*   `color` – matches any atom that contains the word "color" (e.g., `has_color(red)`, `color_schemes(...)`).
*   `_v\d+$` – matches atoms ending with an internal variable name like `_v1`, `_v20`.
*   `^(?!__)` – matches all atoms that *do not* start with two underscores (useful to remove internal scaffolding like `__base64__`).

#### Behavior

*   If the pattern is empty, no filter is applied and all atoms are kept.
*   The filter is applied to the full representation of the atom (predicate name and its terms).
*   Models are kept even if they become empty after filtering (unless followed by a **Remove Empty Models** operation).

