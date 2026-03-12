The **GitHub** operation takes a URL pointing to a public file on GitHub and fetches its content (possibly via jsDelivr).

**Important!** The URL must be in the format `https://github.com/user/repo/blob/version/filepath`. Use **Set HTTP Cache Policy** to configure the cache policy. Note that the GitHub API has a rate limit, while jsDelivr may take some time to update.

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe. If the wildcard `*` is used as URL, URLs are actually taken from the `__base64__` atoms.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.

§§§§

This operation allows you to pull external data or code directly from GitHub repositories into your ASP-chef pipeline.

#### Dynamic URLs with Wildcards

By setting the **URL** option to `*`, you can dynamically fetch files based on the input facts. When using the wildcard, the operation looks for atoms of the same name as the **Predicate** option (default: `__base64__`).

Example input:
```asp
__base64__("https://github.com/example/repo/blob/main/data.json").
```

The operation will replace that atom with:
```asp
__base64__("...base64 content of data.json...").
```

#### Rate Limiting and Caching

GitHub's API enforces rate limits on unauthenticated requests. To avoid hits, ASP-chef often uses `cdn.jsdelivr.net` for faster and more reliable access.

You can control how long the fetched content is cached in your browser using the **Set HTTP Cache Policy** operation earlier in your recipe.

#### Usage Example: Remote Rules

1.  **GitHub**: URL points to an `.asp` file on your repository.
2.  **Search Models**: Use the fetched rules as the program to execute.

This setup allows you to maintain your logic program on GitHub and always have the latest version running in your ASP-chef recipe.

