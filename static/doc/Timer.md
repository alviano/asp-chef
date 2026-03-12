The **Timer** operation invalidates the cache after an interval (of 1 second or more).

It can be used to implement _regular polling_ to external servers (e.g., if followed by **HackMD**).

If an output predicate is specified, the current time is added as a fact of the form `__timer__(HOURS, MINUTES, SECONDS).`

**Attention!** Skipping a timer ingredient does not clear the installed interval. If you want to temporarily disable a timer, click the ACTIVE button **before** skipping the ingredient.

Default value: `5 seconds`

§§§§

This operation allows you to perform time-based updates within your recipe automatically.

#### How it works

The recipe engine normally only re-evaluates a step when its input or its own configuration changes. The **Timer** ingredient adds an internal tick that forces the engine to treat the ingredient as "dirty" every few seconds/minutes, causing all subsequent ingredients in the recipe to be re-evaluated.

#### Use Case: Real-time Data Polling

Suppose you have a shared document on HackMD or a data file on GitHub that is updated by another user or a separate process. To create a live dashboard in ASP-chef:
1.  **Timer**: Set to `10 seconds`.
2.  **GitHub**: Provide the URL to the data file.
3.  **Graph** or **Chart.js**: Visualize the results.

The visualization will update every 10 seconds with the latest data from the remote source.

#### The `__timer__` Fact

By specifying an **Output Predicate** (default: `__timer__`), you can make your logic program time-aware:
```asp
is_afternoon :- __timer__(H, _, _), H >= 12, H < 18.
```
This is useful for creating context-aware recipes that react to the time of day.

