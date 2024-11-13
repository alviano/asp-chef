The **Set HTTP Cache Policy** operation sets the cache policy of any subsequent fetch request.

Possible values:
- `default`: Use cache if fresh, otherwise ask for changes
- `no-store`: Don't use or update cache
- `reload`: Don't use cache, but update it
- `no-cache`: Ask for changes
- `force-cache`: Use cache if available
- `only-if-cached`: Use cache if available, otherwise error
