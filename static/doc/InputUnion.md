The **Input Union** operation computes the union of the models in input.

§§§§

This operation merges multiple separate input models into a single model containing all unique atoms from each input.

#### How it works

Given two or more models in input:
- Model 1: `{ a., b. }`
- Model 2: `{ b., c. }`

The **Input Union** operation will produce a single model:
- Result: `{ a., b., c. }`

#### Use Case: Model Combination

Use this operation when you want to combine results from different parts of a recipe or different solver runs (for example, after a **Search Models** that produced multiple models) to analyze or process them as a single set of facts.

#### Comparison with Union Operation

While the **Union** operation computes the union within a *single* model by executing rules and finding brave consequences, **Input Union** works *across* different models in the current ingredient's input stream.

