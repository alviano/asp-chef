The **Set Optimization Strategy** operation sets the optimization strategy of clingo.

Model-guided and code-guided algorithms are available.

Algorithm `k` comes with a parameter for setting the size of the cardinality constraints added by the unsatisfiable core analysis. Value `0` means _dynamic_.

The number of conflicts in the shrinking can be limited (value `0` for no limit).

Additional options:
- `disjoint`: Disjoint-core preprocessing
- `succinct`: No redundant (symmetry) constraints
- `stratify`: Stratification heuristic for handling weights
