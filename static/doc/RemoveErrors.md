The **Remove Errors** operation discards input parts being errors.

The errors to be discarded can be specified by means of a regular expression.

§§§§

This operation allows you to gracefully handle failures in your recipe by filtering out error reports from the model stream.

#### Error Handling in ASP-chef

Many operations (like **Search Models**, **GitHub**, or **JSON Path**) can generate errors if they fail (e.g., due to a syntax error in rules, a network failure, or an invalid path). These errors are usually passed down the pipeline so the user can see what went wrong.

#### Filtering with Regex

You can use a **Regular Expression** to selectively discard only certain types of errors while letting others pass through:
- `.*`: Discard **all** errors.
- `Timeout`: Discard only timeout errors.
- `404`: Discard only "Not Found" errors from network requests.

#### Use Case: Optional Data Sources

If you have a recipe that fetches data from multiple optional sources (e.g., trying to load a local config and then a remote one), you can use **Remove Errors** after a fetch attempt to ensure that a missing file doesn't stop the entire recipe from executing.

#### Tip: Silence minor issues

Use this ingredient when you want to "silence" known occasional issues that shouldn't interrupt the user experience or the final visualization.

