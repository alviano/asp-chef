The **Set HTTP Cache Policy** operation sets the cache policy of any subsequent fetch request.

Possible values:
- `default`: Use cache if fresh, otherwise ask for changes
- `no-store`: Don't use or update cache
- `reload`: Don't use cache, but update it
- `no-cache`: Ask for changes
- `force-cache`: Use cache if available
- `only-if-cached`: Use cache if available, otherwise error

§§§§

This operation globally configures how ASP-chef interacts with the browser's HTTP cache when fetching remote resources.

#### Targeted Operations

This policy affects any ingredient that performs network requests, including:
- **GitHub**: Fetching remote `.asp`, `.json`, or `.md` files.
- **npm**: Fetching package contents via jsDelivr.
- **HackMD**: Pulling collaborative notes.
- **@config/Register Javascript**: Loading custom operation source code from a URL.

#### Use Cases

*   **Development**: Use `reload` or `no-cache` while you are actively editing a file on GitHub or HackMD to ensure you always see the latest changes.
*   **Offline/Performance**: Use `force-cache` to speed up recipe execution by avoiding network hits for static assets that rarely change.
*   **Strict Consistency**: Use `no-store` if the remote data is highly dynamic and sensitive, ensuring no outdated versions are ever kept in the browser.

#### Persistence

The policy is set at the moment the ingredient is processed and remains active for all subsequent fetch calls in the current recipe execution.

