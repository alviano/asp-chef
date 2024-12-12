The **Predicate to Constants** operation maps selected facts to constant directives.

Each fact of the form `__const__(name, value)` is mapped to the directive `#const name = value.`
The directives are then Base64-encoded in the predicate `__base64__`, which can be used by subsequent operations such as SearchModels or Optimize.

The name of the predicates `__const__` and `__base64__` can be specified in the recipe.
The predicate `__const__` can be echoed in the output.
