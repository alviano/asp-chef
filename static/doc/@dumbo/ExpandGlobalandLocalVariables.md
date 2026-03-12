The **@dumbo/Expand Global and Local Variables** operation can be used to expand _global and local variables_ in the program stored in `__program__`.

§§§§

This operation performs a specialized expansion of variables within an ASP program, handling both global and local scopes as defined in the Dumbo framework.

#### Global vs. Local Expansion

*   **Global Variables**: These are variables that have a consistent value across the entire program or a specific module. The expansion replaces placeholders with their globally assigned values.
*   **Local Variables**: These variables are scoped to specific rules or contexts. The operation ensures that local name-spacing is respected during the expansion process.

#### How it works

The operation processes the program text found in the `__program__` predicate:
1.  It identifies variable placeholders that follow the Dumbo convention for global and local variables.
2.  It resolves the values based on the current context and session variables.
3.  It rewrites the program with the substituted values.

#### Use Case: Parameterized Reusable Modules

When building reusable ASP modules (templates), you often want to keep them generic. By using global and local variable placeholders, you can:
- Define a "local" predicate name that won't clash with other parts of the recipe.
- Pass "global" configuration flags that affect how the module's rules are expanded.

This operation is a key part of the template expansion pipeline within the `@dumbo` collection.

