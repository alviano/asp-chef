The **Remove Empty Models** operation discards empty models.

A list of predicates can be ignored, and a model is discarded if it is empty after discarding instances of the ignored predicates.

§§§§

This operation is a stream-cleaning tool used to filter out models that contain no relevant information.

#### How it works

The operation examines each model in the input stream. If a model has zero atoms, it is removed. If you specify **Ignored Predicates**, the operation first filters out those predicates and then checks if the remaining model is empty.

#### Use Cases: Cleaning Up Solver Output

- **Filtered Results**: If you use a **Show** or **Select Predicates** operation that might leave some models empty (because no atoms matched the criteria), use **Remove Empty Models** to keep the pipeline clean.
- **Incoherent Results**: Sometimes a search might lead to an "empty" stable model that is technically valid but not useful for your visualization.
- **Ignoring Metadata**: Frequently, models contain internal tracking facts (like `__costs__` or `__base64__`). By adding these to the **Ignored Predicates** list, you can ensure that a model is considered "empty" if it only contains those metadata facts and no actual domain facts.

#### Why use it?

Removing empty models prevents visualization components (like **Table**, **Graph**, or **Chart.js**) from attempting to render empty frames or displaying "No data" messages for solutions that are effectively blank.

