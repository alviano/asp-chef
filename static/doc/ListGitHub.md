The **List GitHub** operation takes a URL pointing to a public directory on GitHub and fetches the list of its files (possibly via jsDelivr).

**Important!** The URL must be in the format `https://github.com/user/repo/tree/version/directory/` (ending by slash). Use **Set HTTP Cache Policy** to configure the cache policy. Note that the GitHub API has a rate limit, while jsDelivr may take some time to update.

URLs can be filtered by a case-insensitive regular expression. For example, use `\.js` to select javascript files.

Each URL in output is base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe.
If the wildcard `*` is used as URL, URLs are actually taken from the `__base64__` atoms.

The encoded content can be consumed by operations such as **@config/Register Javascript**.

§§§§

This operation allows you to dynamically discover and process files stored in a GitHub repository.

#### Directory Listing and Fetching

The operation fetches the content of a GitHub directory and extracts all file paths.
- **Base64 Encoding**: Each discovered file's full URL is Base64-encoded.
- **Wrapping**: The encoded URL is wrapped in a predicate (default: `__base64__`).

#### Filtering Results

Use the **Filter** option to specify a regular expression. This is useful for:
- Selecting specific file types (e.g., `\.lp$`, `\.json$`).
- Filtering files in specific subdirectories.

#### Wildcard Usage

If the URL is set to `*`, the operation will instead look for `__base64__` atoms already present in the input model. It will decode these atoms, assume they are GitHub directory URLs, and fetch the file listings for each. This allows for recursive or data-driven directory processing.

#### Integration with Other Operations

The resulting Base64-encoded URLs can be passed to:
1.  **GitHub**: To fetch the actual contents of the discovered files.
2.  **@config/Register Javascript**: To automatically register multiple JavaScript operations stored in a GitHub folder.
3.  **Markdown**: To generate a list of links or interactive buttons.

