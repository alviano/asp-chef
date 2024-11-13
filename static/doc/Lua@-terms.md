The **Lua @-terms** operation extends models in input with some encoded Lua content (usually functions defining @-terms or propagators).

For example `function successor(x)`     `return x.number + 1` `end` to later use `@successor(1)` and obtain `2`.

The content is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.
