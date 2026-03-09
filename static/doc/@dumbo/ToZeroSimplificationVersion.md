The **@dumbo/To Zero Simplification Version** operation rewrites the program stored in `__program__` into an equivalent version that inhibit grounding simplifications.

Atoms with predicate `__false__` are injected in the input program, which is assumed to not already mentions the `__false__` predicate.

Atoms that are expected to be part of the Herbrand base of the program can be given (from a predicate or in the format facts).

§§§§

This operation is a debugging and analysis tool used to prevent Clingo's grounder from performing its standard simplifications.

#### Why Inhibit Simplifications?

Modern ASP grounders are very efficient at removing rules and atoms that they determine to be unreachable or redundant before the solver ever sees them. While this is great for performance, it can make it difficult to:
- **Debug logic errors**: If a rule isn't firing, it might have been simplified away entirely.
- **Inspect Grounding**: If you want to see the full set of possible atoms (the Herbrand Base) without the grounder's intelligent pruning.
- **Proof Generation**: When generating explanations or proofs, you often need the full unsimplified rule set.

#### How it works: The `__false__` Trick

The operation rewrites each rule by injecting a special predicate `__false__` (which is always false) into the bodies. This creates a technical dependency that prevents the grounder from statically determining that an atom can never be true, thus forcing it to include the atom and the rule in the grounded output.

#### Options

*   **Herbrand Base**: You can provide a set of atoms that you want to ensure are included in the grounded program. This helps the rewriter know which terms must be "protected" from simplification.
*   **Program Predicate**: The name of the predicate containing the Base64-encoded program to transform (default: `__program__`).

#### Use Case: Explaining Incoherence

If a program is incoherent (no stable models), it can be very hard to find out why. By using **To Zero Simplification Version**, you can preserve the full structure of the program during grounding, which can then be analyzed by explanation tools (like those in the `@dumbo` collection) to find the source of the conflict.

