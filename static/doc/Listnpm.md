The **List npm** operation takes a URL pointing to a public directory on npm and fetches the list of its files (via jsDelivr).

**Important!** The URL must be in the format `https://cdn.jsdelivr.net/npm/package@version/directory/` (ending by slash). Use **Set HTTP Cache Policy** to configure the cache policy.

URLs can be filtered by a case-insensitive regular expression. For example, use `\.js` to select javascript files.

Each URL in output is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

The encoded content can be consumed by operations such as **@config/Register Javascript**.
