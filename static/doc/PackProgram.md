The **Pack Program** operation packs each input part to a program.

Each program is stored in a `__base64__` predicate.

§§§§

This operation takes all the atoms in each model and combines them into a single Base64-encoded string, which is then wrapped in a predicate (default: `__base64__`).

#### How it works

Unlike **Encode Input**, which takes the entire input stream (multiple models) and packs it into one fact, **Pack Program** works on each model individually:
- For each model in the input, it collects all atoms.
- If an atom is already a Base64-encoded fact (matching the `decode_predicate`), it decodes it and includes the content.
- Everything is concatenated into a single text block (an ASP program) and re-encoded.

#### Use Case: Recursive Solving

A common pattern is to have a recipe that generates a set of rules as facts, packs them into a program, and then passes them to a **Search Models** or **Intersection** operation to be solved.

#### Example

If a model contains:
```asp
rule("a :- b.").
rule("b.").
```
Applying **Pack Program** (with `rule` as the decode predicate) will result in a single fact containing the Base64 encoding of:
```asp
a :- b.
b.
```

This allows you to dynamically build programs from atoms and then "activate" them for solving.

