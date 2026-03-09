The **Select Predicates** operation selects some predicates from the models in input.

§§§§

This operation allows you to filter the atoms in each model based on their predicate names, keeping only the ones you are interested in.

#### How it works

The operation presents a list of all unique predicate names found in the current input models. You can toggle each predicate to include or exclude it from the output.
- **Checked**: Atoms with this predicate name are kept.
- **Unchecked**: Atoms with this predicate name are discarded.

#### Use Case: Model Cleaning

As recipes grow complex, models often become cluttered with intermediate facts, internal marker predicates (like `__base64__` or `__index__`), or debugging information. Use **Select Predicates** to "harvest" only the domain-relevant facts before passing them to a visualization ingredient like **Table** or **Graph**.

#### Comparison with Show

- **Select Predicates**: Provides a user-friendly UI with checkboxes to pick from predicates already present in the model.
- **Show**: Requires writing `#show` directives but allows for more complex projections and transformations using ASP syntax.

Use **Select Predicates** for quick, visual filtering of existing data.

