The **Unique** operation removes each model that is preceded by another copy of the model.

Each model is compared with previous models and provided in output only if it is unique. A list of predicates can be ignored.

Note that order of elements in models does matter, that is, models with the same elements but in different orders will be considered different models. A **Sort Canonical** operation can be used to make the ordering immaterial.

§§§§

This operation ensures that only unique models pass through to subsequent ingredients.

#### How it works

The operation keeps a history of all models seen so far in the current input part. For each new model, it checks if an identical model exists in its history:
- Model 1: `{ a., b. }` (Kept)
- Model 2: `{ c., d. }` (Kept)
- Model 3: `{ a., b. }` (Discarded)

#### Canonical Sorting

Crucially, ASP models are sets of atoms, but they are often internally stored as ordered lists. To ensure `{ a., b. }` matches `{ b., a. }`, always place a **Sort Canonical** operation before the **Unique** operation.

#### Ignoring Predicates

By specifying **Ignore Predicates**, you can determine uniqueness based only on external facts, ignoring internal headers or configuration atoms:
- Model 1: `{ a., cost(10) }`
- Model 2: `{ a., cost(20) }`

If you add `cost` to the ignore list, Model 2 will be discarded because it’s "redundant" (both models have `{ a. }`).

#### Comparison with Unique Consecutive

Unlike **Unique Consecutive**, which only checks the *last* model seen, the **Unique** operation performs a full check against the *entire* history of models. This ensures absolute uniqueness but may be slower for very large collections of models.

