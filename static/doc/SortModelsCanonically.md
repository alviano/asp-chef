The **Sort Models Canonically** operation sorts the array of models in input according to their string representation.

A list of predicates can be ignored.

§§§§

This operation reorders the sequence of models itself, rather than the atoms within them. This is useful for providing a deterministic order to a set of solver solutions.

#### How it works

The operation converts each model into a canonical string representation (by internally sorting its atoms and concatenating them) and then sorts the list of models alphabetically based on these strings.

#### Ignoring Predicates

You can select **Excluded predicates** in the ingredient UI. These predicates will be skipped when calculating the model's representation for sorting. This allows you to sort models based only on "important" domain facts while ignoring metadata, timestamps, or internal wrap predicates.

#### Use Cases

*   **Stable UI**: Ensure that when you refresh a recipe, the list of models in a **Table** or **Graph** view appears in the same consistent order.
*   **Comparison**: Preparing a list of models for a **Unique** operation across different solver runs.

