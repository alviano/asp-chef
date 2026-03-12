The **Regex Substitution** operation replaces a pattern with a replacement in Base64-encoded predicate.

The pattern is built from a string and flags (refer the `RegExp` documentation [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)).

The replacement string can use group references (e.g., $1, $2, and so on).

The name of the `__base64l__` predicate can be specified in the recipe.

§§§§

This operation allows for sophisticated text manipulation of Base64-encoded content within your models.

#### How it works

The operation scans each model for atoms of the specified predicate (default: `__base64__`).
1. It decodes the Base64 content into a string.
2. It applies a JavaScript `replace()` function using the provided **Regex** and **Flags**.
3. It performs the replacement using the **Replacement** string.
4. It re-encodes the result into Base64 and updates the atom.

#### Advanced Text Processing

Since this operation supports standard JavaScript Regular Expressions, you can perform complex tasks:
- **Global Replacements**: Use the `g` flag to replace all occurrences.
- **Case Insensitive**: Use the `i` flag.
- **Capturing Groups**: Use parentheses in your regex and `$1`, `$2`, etc., in your replacement string to rearrange text.

#### Use Case: Rule Transformation

If you fetch logic rules from a remote source (like **GitHub**) but need to rename a predicate before solving:
- **Regex**: `my_predicate`
- **Replacement**: `new_name`
This allows you to dynamically adapt external logic to your local model structure without modifying the source file.

