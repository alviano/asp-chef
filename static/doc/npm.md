The **npm** operation takes a URL pointing to a public file on npm and fetches its content (via jsDelivr).

**Important!** The URL must be in the format `https://cdn.jsdelivr.net/npm/package@version/file`. Use **Set HTTP Cache Policy** to configure the cache policy.

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.

§§§§

This operation allows you to pull external content—such as logic rules, JSON data, or JavaScript code—directly from the npm repository into your ASP-chef recipe.

#### How it works

The operation performs an HTTP fetch to the jsDelivr CDN, which serves files from the npm registry.
- The fetched file content is automatically Base64-encoded.
- It is then wrapped in a standard fact (e.g., `__base64__("...")`) and added to every model in the current input.

#### Use Case: Shared Logic Libraries

If you have a set of reusable ASP rules or data schemas published as an npm package, you can use this operation to:
1.  **Fetch** the rules from npm.
2.  **Pass** them to a **Search Models** or **Optimize** ingredient.
3.  **Execute** your logic against these standard definitions without needing to copy-paste them into every recipe.

#### Formatting Requirements

Ensure you use the direct file URL from jsDelivr. For example, to fetch a file `rules.lp` from version `1.0.0` of a package `@user/my-logic`:
`https://cdn.jsdelivr.net/npm/@user/my-logic@1.0.0/rules.lp`

