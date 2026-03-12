The **Lua @-terms** operation extends models in input with some encoded Lua content (usually functions defining @-terms or propagators).

For example 
```lua
function successor(x)
  return x.number + 1
end
```
to later use `@successor(1)` and obtain `2`.

The content is Base64-encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

§§§§

This operation allows you to define custom Lua functions that can be called directly from your ASP rules using the `@` syntax.

#### How it works

The operation takes the Lua code you provide in the editor and wraps it in a `#script (lua)` block. This block is then Base64-encoded and added to each model in the input. When a subsequent **Search Models** or **Optimize** operation runs, Clingo's internal Lua interpreter registers these functions.

#### Defining Functions

In the **Content** editor, you can define standard Lua functions:
```lua
function my_add(a, b)
    return a + b
end

function my_greet(name)
    return "Hello, " .. tostring(name)
end
```

#### Calling from ASP

Once defined, you can use these functions in your logic rules:
```asp
result(@my_add(10, 20)).
greeting(@my_greet("World")).
```

#### Advanced Logic Integration

Lua functions can be used to perform complex calculations, string manipulations, or procedural logic that is difficult to express in pure ASP.
- **Input Types**: ASP integers, strings, and constants are automatically mapped to Lua numbers and strings.
- **Return Types**: Lua return values are converted back to corresponding ASP terms.

#### Workflow: Library Injection

1.  **Lua @-terms**: Define your utility functions.
2.  **Search Models**: Your rules now have access to these functions.
3.  **Output**: The resulting models will contain the evaluations of your `@` calls.

#### Integration with other Lua operations

This operation is designed to work alongside **Lua Expression @-terms** and **Lua String @-terms**, providing a central place to define your own procedural extensions to the ASP language.

