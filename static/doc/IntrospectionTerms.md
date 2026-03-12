The **Introspection Terms** operation extends models in input with some encoded Lua content.

The definitions are Base64 encoded and wrapped by the specified predicate (defaulting to `__at_term__`).

The name of the unary predicate can be specified in the recipe.
Moreover, the name of the @-terms defined by this operation can be customized.

§§§§

This operation introduces specialized **Lua scripts** into your ASP program that allow for powerful "introspection" into the data terms.

#### What are Custom Terms?

ASP solvers like Clingo allow for custom @-terms defined in Lua or Python. This operation automatically generates and encodes these functions as Base64 strings, which you can then "load" into your program.

#### Defined Functions

The generated Lua code includes several useful @-functions:
- **`@argument(term, index)`**: Gets the argument at the given index (1-based) of a functor term.
- **`@arity(term)`**: Returns the arity (number of arguments) of a term.
- **`@functor(term)`**: Gets the name (functor) of the term.
- **`@error_message(error_atom)`**: Returns a human-readable error message from a specialized error atom.

#### Example: Processing Wrapped Atoms

If you have an atom `wrap(person(john, 25))` and you want to extract "person" as a string and "john" as a constant:
```asp
name(@functor(X)) :- wrap(X).
first_arg(@argument(X, 1)) :- wrap(X).
```

#### Integration with Recipe

1.  Add the **Introspection Terms** ingredient.
2.  Add a **Search Models** ingredient.
3.  In the **Search Models** program, use the decoded Base64 content (via a Decode operation if necessary) and then use the `@-terms` in your logic.

