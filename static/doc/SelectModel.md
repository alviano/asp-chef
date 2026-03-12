The **Select Model** operation selects one model among those in input.

§§§§

This operation is used to isolate a single model from a sequence of models, allowing you to focus on a specific solution.

#### Choosing a Model

Input to this operation is a stream of models (e.g., from **Search Models** or **Optimize**).
- **Index**: Specify which model to pick (1 for the first, 2 for the second, and so on).
- **Last**: If you want the very last model in the stream (useful after an **Optimize** run to get the best found solution), you can use a combination of **Reverse Models** followed by **Select Model** with index 1.

#### Use Cases

1.  **Comparative Analysis**: If you find 10 stable models but only want to build a report for the 3rd one.
2.  **Model Navigation**: Use a **Slider** to dynamically change the index of **Select Model**, creating an interactive solution browser.

#### Tip: Stream Reduction

By selecting a single model, you reduce the "count" of models in the pipeline to 1. This prevents subsequent ingredients from running multiple times if you only intended to visualize or process one specific result.

