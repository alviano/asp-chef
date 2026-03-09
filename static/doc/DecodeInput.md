The **Decode Input** operation expands the input with the Base64 encoded content in the specified predicate.

The expanded input is processed according to the input format, that is, using the separator `§` to separate models.

The name of the unary predicate `__base64__` used to wrap the Base64 content can be specified in the recipe.

The instances of `__base64__` can be echoed or suppressed. Other predicates in input can be included or excluded.

§§§§

This operation is useful when you have a program or data that has been Base64-encoded (for example, by an **Encode** operation) and you want to use it as the new input for subsequent operations.

### Example: Basic Decoding

Suppose we have the following input:
```asp
__base64__("cHJlZGljYXRlKDEpLiBwcmVkaWNhdGUoMiku").
```
The string `cHJlZGljYXRlKDEpLiBwcmVkaWNhdGUoMiku` is the Base64 encoding of `predicate(1). predicate(2).`.

Applying **Decode Input** with the default predicate `__base64__` will result in:
```asp
predicate(1).
predicate(2).
```

#### Multiple Models

If the Base64 content contains the model separator `§`, the operation will correctly split it into multiple models.

Suppose the encoded content is `part1. § part2.`.
The input:
```asp
__base64__("cGFydDEuIMKnIHBhcnQyLg==").
```
will be decoded into two models:
- Model 1: `part1.`
- Model 2: `part2.`

### Integration with Encode

You can use **Encode** to wrap some facts and then **Decode Input** to "unwrap" them. This is often used in complex workflows where you want to pass different sets of rules or data through the pipeline.

