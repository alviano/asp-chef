The **GitHub** operation takes a URL pointing to a public file on GitHub and fetches its content (possibly via jsDelivr).

**Important!** The URL must be in the format `https://github.com/user/repo/blob/version/filepath`. Use **Set HTTP Cache Policy** to configure the cache policy. Note that the GitHub API has a rate limit, while jsDelivr may take some time to update.

The content is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe. If the wildcard `*` is used as URL, URLs are actually taken from the `__base64__` atoms.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.
