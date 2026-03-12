The **Meta Here and There Models** operation extends models in input with some encoded meta programming encoding.

The meta encoding can be used to compute here-and-there models of a reified program (see the **Reify Program** operation).

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

Encoding from https://teaching.potassco.org/meta/

§§§§

This operation provides the rules for computing models under the **Here-and-There (HT)** logic semantics, which is the logical basis for the Answer Set Semantics.

#### What are Here-and-There Models?

HT logic is an intermediate logic between classical logic and intuitionistic logic. An HT model is a pair of classical models $(H, T)$ such that $H \subseteq T$.
- $T$ represents "total" knowledge (a standard classical model).
- $H$ represents "here" knowledge (what is currently proven).

Stable models are HT models where $H = T$ and no smaller $H$ exists for the same $T$.

#### How to use

1.  **Reify Program**: Convert your ASP program into facts.
2.  **Meta Here and There Models**: Inject the meta-rules defining HT semantics.
3.  **Search Models**: Find the HT models of the reified program.

#### Use Cases

*   **Logical Analysis**: Studying the properties of a program beyond its stable models.
*   **Equivalence Checking**: Testing if two programs are strongly equivalent (they are strongly equivalent if and only if they have the same HT models).
*   **Debugging**: Identifying why a program is incoherent by examining its HT models.

