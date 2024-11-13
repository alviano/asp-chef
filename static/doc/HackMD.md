The **HackMD** operation takes a URL pointing to a public note on HackMD and fetches its content.

**Important!** The note must be _published_ or _readable by everyone_. Use **Set HTTP Cache Policy** to configure the cache policy.

The content is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.
