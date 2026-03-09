The **Input Intersection** operation computes the intersection of the models in input.

§§§§

This operation finds the set of atoms that are present in **every** model currently in the input.

#### How it works

If you have three models:
- Model 1: `{ a., b., c. }`
- Model 2: `{ a., b., d. }`
- Model 3: `{ a., e. }`

The **Input Intersection** will produce a single model:
- Result: `{ a. }`

#### Use Case: Model Consensus

This is particularly useful when you have multiple solutions from an ASP solver (for example, after a **Search Models** operation with "All models" selected) and you want to see which facts are "true in all solutions" (cautious consequences).

#### Comparison with Intersection Operation

While the **Intersection** operation computes the intersection within a *single* model by executing rules and finding cautious consequences, **Input Intersection** works *across* different models in the current ingredient's input stream.

