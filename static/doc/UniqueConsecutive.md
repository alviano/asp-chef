The **Unique Consecutive** operation removes each model that is **immediately** preceded by another copy of the model.

Each model is compared with the previous model and provided in output only if they are different. A list of predicates can be ignored.

Note that order of elements in models does matter, that is, models with the same elements but in different orders will be considered different models. A **Sort Canonical** operation can be used to make the ordering immaterial. A **Sort Models Canonically** operation can be used to obtain a behavior analogous to the **Unique** operation (even if it would make more sense to opt for the **Unique** operation in this case).
