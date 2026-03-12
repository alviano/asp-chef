The **Set Transformation of Extended Rules** operation configures handling of extended rules in clingo.

Default value is `all`. Possible values:
- `all`: Transform all extended rules to basic rules
- `choice`: Transform choice rules, but keep cardinality and weight rules
- `card`: Transform cardinality rules, but keep choice and weight rules
- `weight`: Transform cardinality and weight rules, but keep choice rules
- `scc`: Transform "recursive" cardinality and weight rules
- `integ`: Transform cardinality integrity constraints
- `dynamic`: Transform "simple" extended rules, but keep more complex ones
- `no`: Disable

§§§§

This operation allows you to control how Clingo's grounder handles complex rule types (like choice rules `{...}` or cardinality constraints `1 { ... } 1`).

#### Why Change Transformations?

While Clingo's default behavior is usually optimal, certain theoretical or performance-related scenarios might require you to explicitly basicize rules (turning them into normal ASP rules) or to keep them in their original form for the solver to process.

#### Usage Scenario: Debugging Grounding

If you are inspecting the reified output of a program (via **Reify Program**), changing these settings will change how rules are represented in the resulting facts. Setting it to `all` will ensure that the reified output primarily contains normal rules, making it easier to reason about if your meta-rules only support basic rule structures.

#### Effect on Solver

This operation globally affects the Clingo configuration for all *subsequent* operations in the recipe (like **Search Models**, **Optimize**, etc.). It is often used in conjunction with **Set Configuration** to fine-tune the grounding and solving process.

