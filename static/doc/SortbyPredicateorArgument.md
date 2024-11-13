The **Sort by Predicate or Argument** operation sorts each model in input according to the specified criteria.

If the specified index is 0, atoms are sorted by predicate. Otherwise, atoms are sorted by the term at the specified index.

The order can be ascending (the default) or descending.

Note that a stable sort algorithm is used. Ordering of ties can be specified by adding another {operation} operation (first criteria come after in the recipe).
