The **Timer** operation invalidate the cache after an interval (of 1 second or more).

It can be used to implement _regular polling_ to external servers (e.g., if followed by **HackMD**).

If an output predicate is specified, the current time is added as a fact of the form `__timer__(HOURS, MINUTES, SECONDS).`

**Attention!** Skipping a timer ingredient does not clear the installed interval. If you want to temporarily disable a timer, click the ACTIVE button **before** skipping the ingredient.

Default value: `5 seconds`
