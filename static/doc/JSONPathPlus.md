The **JSON Path Plus** operation applies JSON Path Plus queries to Base64 encoded JSON documents (use an Encode operation).

Each object in the answer is mapped to a fact. Strings are quoted. Arrays are expanded to arguments. Objects are mapped to functions (keys are expected to be valid terms). An example is reported below.

```
{
    "nodes": [1, 2, 3],
    "links": [
        [1, 2],
        [2, 3],
        [3, 1]
    ]
}
```

Two JSON Path Plus queries, `$.nodes.*` and `$.links.*` can produce
```
node(1). node(2). node(3).
link(1,2).
link(2,3).
link(3,1).
```
