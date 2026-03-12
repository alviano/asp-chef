The **JSON Path** operation applies JSON Path queries to Base64 encoded JSON documents (use an **Encode** operation).

Each object in the answer is mapped to a fact. Strings are quoted. Arrays are expanded to arguments. Objects are mapped to functions (keys are expected to be valid terms). An example is reported below.

```json
{
    "nodes": [1, 2, 3],
    "links": [
        [1, 2],
        [2, 3],
        [3, 1]
    ]
}
```

Two JSON Path queries, `$.nodes.*` and `$.links.*` can produce
```asp
node(1). node(2). node(3).
link(1,2).
link(2,3).
link(3,1).
```

§§§§

This operation allows you to extract data from JSON documents and transform them directly into ASP facts using the [JSONPath](https://github.com/JSONPath-Plus/JSONPath) syntax.

#### How it works

1.  **Decode**: It takes a Base64-encoded string from the `decode_predicate` (default: `__base64__`).
2.  **Query**: It applies the `query` (e.g., `$.store.book[*].author`).
3.  **Map**: Each result from the query is transformed into an ASP atom:
    - **Simple values** (numbers, strings) become atoms: `__json__(value)`.
    - **Arrays** become atoms with multiple terms: `__json__(arg1, arg2, ...)`.
    - **Objects** become functional terms: `__json__(key1(val1), key2(val2), ...)`.

#### Output Predicate

The generated facts use the `output_predicate` (default: `__json__`). You can change this to match your domain (e.g., `person`, `edge`, etc.).

#### Example: Extracting Nested Data

Suppose you have this JSON:
```json
{
  "users": [
    { "id": 1, "info": { "name": "Alice", "age": 30 } },
    { "id": 2, "info": { "name": "Bob", "age": 25 } }
  ]
}
```

Using query `$.users[*]` and output predicate `user`:
- Atom 1: `user(id(1), info(name("Alice"), age(30)))`
- Atom 2: `user(id(2), info(name("Bob"), age(25)))`

#### Integration with Recipe

Common workflow:
1.  **GitHub** or **HackMD**: Fetch a JSON file.
2.  **JSON Path**: Extract the relevant parts into facts.
3.  **Search Models**: Use the extracted facts in your logic.

