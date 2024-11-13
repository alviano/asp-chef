The **Unreify Program** operation reverts the reification process (as much as possible).

Predicates `atom_tuple`, `literal_tuple`, `output`, `rule` and `weighted_literal_tuple` in input are mapped to a program. Rules are made of `disjunction`, `choice`, `normal` and `sum`.

The program is base64 encoded and wrapped by predicate `__base64__`. The name of the unary predicate `__base64__` can be specified in the recipe.

Predicates defining the program can be echoed in the output.

Note that the operation does an attempt to reconstruct names of atoms from output directives, but this is not always possible. Atoms without a name are identified by predicate `__atom__` (or anything else specified in the recipe).
