The **@dumbo/Herbrand Base** operation returns the Herbrand base of the program stored in `__program__`.

The result is stored in predicate `__herbrand_base__`. Atoms with predicate `__false__` are excluded from the base.

§§§§

This operation computes the set of all possible ground atoms (the Herbrand Base) that can be formed from the constants and predicates in your program.

#### Why compute the Herbrand Base?

In Answer Set Programming, the Herbrand Base represents the "universe" of all possible facts. Computing it explicitly is essential for several advanced Dumbo operations:
- **Explanation Generation**: Tools like **Explanation Graph** use the Herbrand Base to understand all potential justifications for a literal.
- **Simplification Analysis**: It helps in identifying which parts of the search space are reachable.
- **Verification**: Ensuring that your rules can ground to the expected specific instances of your predicates.

#### How it works

The operation takes the program stored in the `__program__` predicate (Base64-encoded) and performs a grounding pass (similar to what `clingo` does before solving) to identify all possible ground atoms.
- **Filtering**: Atoms with the special `__false__` predicate are automatically excluded, as they are typically used as technical markers (e.g., by the **To Zero Simplification Version** operation).
- **Storage**: The resulting set of atoms is added to the model using the `__herbrand_base__` predicate (or a customized name).

#### Use Case: Baseline for Explanations

Before generating a justification for why a fact is true (or false), you frequently need to run **Herbrand Base** to provide the necessary contextual data to the explanation engine.

