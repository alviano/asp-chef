0The **Unreify Program** operation reverts the reification process (as much as possible).

Predicates `atom_tuple`, `literal_tuple`, `output`, `rule` and `weighted_literal_tuple` in input are mapped to a program. Rules are made of `disjunction`, `choice`, `normal` and `sum`.

The program is base64 encoded and wrapped by predicate `__base64__`. The name of the unary predicate `__base64__` can be specified in the recipe.

Predicates defining the program can be echoed in the output.

Note that the operation does an attempt to reconstruct names of atoms from output directives, but this is not always possible. Atoms without a name are identified by predicate `__atom__` (or anything else specified in the recipe).

§§§§

This operation is a powerful tool for meta-programming in ASP.

#### What is Unreification?

Reification (via **Reify Program**) turns an ASP program into a set of facts. This allows you to write "meta-rules" that transform the program itself (like the **Symmetric Closure** or **Transitive Closure** operations). **Unreify Program** does the reverse: it turns those facts (e.g., `rule/2`, `literal_tuple/2`, etc.) back into a parsable ASP program.

#### How it works

The operation searches the input for standard reification predicates defined by the Clingo `--output=reify` format. It then reconstructs the corresponding ASP logic rules:
- `rule(disjunction(1), normal(2))` might become `a :- b.`.

#### Challenges in Unreification

1.  **Atom Names**: Reification often loses the original names of the atoms (e.g., `person`, `edge`), replacing them with IDs like `1, 2, 3`. The operation uses `output/2` facts if they are present in the reified models to restore the original names.
2.  **Fallback**: If an atom name cannot be found, it is represented as a special term (default: `__atom__(ID)`).

#### Usage Workflow: Meta-Transformation

1.  **Reify Program**: Turn rules into facts.
2.  **Search Models**: Apply ASP meta-rules to modify the facts (e.g., adding symmetry).
3.  **Unreify Program**: Turn the modified facts back into rules.
4.  **Search Models**: Solve the transformed program.

