The **npm** operation takes a URL pointing to a public file on npm and fetches its content (via jsDelivr).

**Important!** The URL must be in the format `https://cdn.jsdelivr.net/npm/package@version/file`. Use **Set HTTP Cache Policy** to configure the cache policy.

The content is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.
