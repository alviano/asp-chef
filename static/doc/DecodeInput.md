The **Decode Input** operation expand the input with the base64 encoded content in the specified predicate.

The expanded input is processed according to the input format, that is, using the separator `§` to separated models.

The name of the unary predicate `__base64__` used to wrap the base64 content can be specified in the recipe.

The instances of `__base64__` can be echoed or suppressed. Other predicates in input can be included or excluded.