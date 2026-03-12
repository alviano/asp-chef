The **List npm** operation takes a URL pointing to a public directory on npm and fetches the list of its files (via jsDelivr).

**Important!** The URL must be in the format `https://cdn.jsdelivr.net/npm/package@version/directory/` (ending by slash). Use **Set HTTP Cache Policy** to configure the cache policy.

URLs can be filtered by a case-insensitive regular expression. For example, use `\.js` to select JavaScript files.

Each URL in output is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

The encoded content can be consumed by operations such as **@config/Register Javascript**.

§§§§

This operation allows you to dynamically discover files within an npm package and prepare them for use in your recipe.

#### How it works

The operation fetches the directory listing from jsDelivr's CDN. It parses the HTML response to find all file links within the specified directory.
- Each found file path is turned into a full URL.
- These URLs are filtered based on the provided `filter` regex.
- Each matching URL is Base64-encoded and added as a new fact to each model in the input.

#### Filtering

The `filter` option is a regular expression. Examples:
- `\.js$` – selects only files ending in `.js`.
- `^.*/src/` – selects only files located in a `src` subdirectory.

#### Workflow: Dynamic Operation Loading

A powerful use of **List npm** is to automatically register all JavaScript operations provided by a package:
1.  **List npm**: URL points to the operations directory of an npm package, filter set to `\.js$`.
2.  **@config/Register Javascript**: Takes the Base64-encoded URLs and registers them as new operations in the ASP-chef environment.

This allows for highly modular and extensible recipes that can pull in capabilities from the npm ecosystem.

