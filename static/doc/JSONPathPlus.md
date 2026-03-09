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

§§§§

This operation is a powerful tool for extracting data from JSON documents and transforming it into ASP facts.

#### JSON to ASP Mapping

The operation parses JSON objects and maps them to facts based on the specified **Predicate** and **Query**.
- **Values**: Primitive types (numbers, booleans, strings) are converted to ASP terms.
- **Arrays**: Are expanded as positional arguments of a predicate.
- **Objects**: Are mapped to functional terms, where keys are the functors.

#### Query Syntax

**JSONPath Plus** extends the standard JSONPath syntax with advanced features:
- `$.` – Root of the JSON object.
- `..` – Deep scan for a property.
- `[*]` or `.*` – Elements of an array or properties of an object.
- `?(@.price < 10)` – Filtering elements based on a condition.

#### Dynamic Fact Generation

You can specify multiple queries, each with its own associated predicate name. For each match found by a query, a new fact is added to the model.

#### Multi-Model Processing

If the input contains multiple Base64-encoded JSON documents (in different atoms), the operation applies the queries to each document separately, ensuring that the resulting facts are added to the correct models.

#### Use Case: API Integration

When you fetch a JSON response from an external API (using **GitHub** or **npm**):
1.  **JSON Path Plus**: Extract only the relevant fields (e.g., all user IDs).
2.  **Search Models**: Use those IDs in your logic program.
3.  **Table**: Visualize the resulting facts cleanly.

