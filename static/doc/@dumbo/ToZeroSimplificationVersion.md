The **@dumbo/To Zero Simplification Version** operation rewrites the program stored in `__program__` into an equivalent version that inhibit grounding simplifications.

Atoms with predicate `__false__` are injected in the input program, which is assumed to not already mentions the `__false__` predicate.

Atoms that are expected to be part of the Herbrand base of the program can be given (from a predicate or in the format facts).
