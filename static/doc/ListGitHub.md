The **List GitHub** operation takes a URL pointing to a public directory on GitHub and fetches the list of its files (possibly via jsDelivr).

**Important!** The URL must be in the format `https://github.com/user/repo/tree/version/directory/` (ending by slash). Use **Set HTTP Cache Policy** to configure the cache policy. Note that the GitHub API has a rate limit, while jsDelivr may take some time to update.

URLs can be filtered by a case-insensitive regular expression. For example, use `\.js` to select javascript files.

Each URL in output is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.
If the wildcard `*` is used as URL, URLs are actually taken from the `__base64__` atoms.

The encoded content can be consumed by operations such as **@config/Register Javascript**.
