The **Invalidate Cache** operation does almost nothing... it just forces the next ingredient to be recomputed!

Any cached result for the ingredient following this operation is discarded.

§§§§

This operation is useful for forcing your recipe to always recompute a particular step, especially when that step depends on external data that might change outside of the recipe itself.

#### Why Invalidate Cache?

ASP-chef normally caches the output of each ingredient for performance. However, if your recipe:
1.  **Fetches from a URL** (via **GitHub**, **HackMD**, or **Javascript**) that might change independently of the recipe.
2.  **Depends on a non-deterministic source** (like an LLM call or a random number generator).

Then you might want to ensure that the next ingredient is *never* cached.

#### Use Case: Always Fetch Latest Rule

If you are pulling a rule from a remote GitHub repository that you frequently update:
1.  **Invalidate Cache**
2.  **GitHub** (fetches the rule)
3.  **Search Models** (solves with the current rule)

Without the **Invalidate Cache** step, the **GitHub** ingredient might keep returning a cached version of the rule even if the remote file has been updated.

#### Summary

- It doesn't modify facts or models.
- It only affects the *caching* behavior of the recipe engine.
- It ensures a "fresh" execution of the subsequent ingredient every time the recipe runs.

