The __Unwrap__ operation reverse the Wrap operation.

Each atom in input of the form
```asp
__atom__(ATOM).
```
is replaced by
```asp
ATOM.
```

The name of the unary predicate `__atom__` can be specified in the recipe.

§§§§

This operation "extracts" atoms that were previously wrapped into a single term.

#### Why Use Unwrap?

Wrapping and unwrapping are common patterns in ASP-chef when you need to pass "atoms as data" between different parts of a recipe.

If you have:
```asp
__atom__(person(john, 25)).
```
The **Unwrap** operation turns it into:
```asp
person(john, 25).
```

#### Integration with Wrap

- **Wrap**: Useful for "shielding" atoms from certain operations (like **Intersection**) or for collecting them into a single term for meta-reasoning.
- **Unwrap**: Used when you are ready to "restore" those atoms back into the active model.

#### Examples: Predicate Mapping

Suppose you have results wrapped in `temp_result(...)` from an intermediate step:
1.  Set the **Predicate** to `temp_result`.
2.  The **Unwrap** operation will extract all terms contained within `temp_result` and place them at the top level of the model.

