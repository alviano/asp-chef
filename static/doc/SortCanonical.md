The **Sort Canonical** operation sorts elements of each model according to their string representation.

§§§§

This operation is essential for normalizing models. In ASP, a model is logically a set of atoms where order doesn't matter. however, in ASP-chef, models are often handled as lists.

#### Why Use Sort Canonical?

Many operations that compare models (like **Unique**, **Unique Consecutive**, or **Input Intersection**) are sensitive to the internal order of atoms. If you have two models:
- Model A: `{ p(1). p(2). }`
- Model B: `{ p(2). p(1). }`

They represent the same logic state, but without **Sort Canonical**, ASP-chef might treat them as different.

#### Usage Scenario

Always place a **Sort Canonical** operation before:
1.  **Unique**: To ensure duplicate sets of facts are correctly identified and removed.
2.  **Unique Consecutive**: To detect when the underlying logic state hasn't changed between steps.
3.  **Table**: To provide a consistent view where atoms always appear in the same relative order.

