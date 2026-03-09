The **Symmetric Closure** operation extends models in input with the rules encoding the symmetric closure of a predicate.

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

§§§§

This operation is a convenience tool for defining undirected relationships from directed ones.

#### How it works

The operation generates ASP rules that ensure if a relationship exists in one direction, it also exists in the other.

If you specify `friend` as the **Input Predicate** and `is_friend` as the **Closure Predicate**, it will generate:
```asp
is_friend(X, Y) :- friend(X, Y).
is_friend(Y, X) :- friend(X, Y).
```
The result is Base64-encoded and wrapped in the **Encode Predicate** (e.g., `__program__`), making it ready for a subsequent solver operation.

#### Use Case: Undirected Graphs

Many datasets (like CSVs) might only list an edge between two entities once. If your logic requires an undirected graph (where `edge(a, b)` implies `edge(b, a)`), use **Symmetric Closure** to automatically inject the necessary completion rules.

#### Predicate Customization

- **Input Predicate**: The name of the existing (directed) relation.
- **Closure Predicate**: The name for the new (symmetric) relation.
- **Encode Predicate**: The predicate that will contain the generated ASP rules.
