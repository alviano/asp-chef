The **Set Optimization Strategy** operation sets the optimization strategy of clingo.

Model-guided and code-guided algorithms are available.

Algorithm `k` comes with a parameter for setting the size of the cardinality constraints added by the unsatisfiable core analysis. Value `0` means _dynamic_.

The number of conflicts in the shrinking can be limited (value `0` for no limit).

Additional options:
- `disjoint`: Disjoint-core preprocessing
- `succinct`: No redundant (symmetry) constraints
- `stratify`: Stratification heuristic for handling weights

§§§§

This operation allows for advanced tuning of Clingo's optimization engine, which is utilized during **Optimize** operations.

#### Heuristics

- **Disjoint**: Can improve performance by identifying independent sub-problems within the optimization objective.
- **Succinct**: Reduces the number of constraints generated during optimization, which can lead to faster solving times in some cases.
- **Stratify**: Highly recommended for problems with many different weight levels in weak constraints. It helps the solver focus on high-priority objectives first.

#### Effect on Recipe

This configuration globally changes the solver flags used by all subsequent **Optimize** ingredients in your recipe.

