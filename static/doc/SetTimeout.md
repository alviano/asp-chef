The **Set Timeout** operation sets the timeout for subsequent calls to clingo.

An error is generated if the timeout is reached. Note that some extra time is required to recover the system, and refreshing the page is also required in some cases.

Default value: `30 seconds`

§§§§

This operation is a safeguard for your browser's performance and responsiveness when dealing with complex logic programs.

#### Why Use a Timeout?

Solving ASP problems can sometimes take a significant amount of time, especially if the search space is large or the grounding is heavy. Without a timeout, a runaway solving process could freeze your browser tab.

#### How it works

The operation sets a global limit for any *subsequent* operations that invoke the Clingo solver (like **Search Models**, **Optimize**, or **Intersection**).

If the solver does not return a result within the specified number of seconds:
1.  The solving process is forcibly terminated.
2.  An `Error: Timeout` is reported in the recipe.
3.  The input models are usually forwarded with the error attached to prevent total recipe failure.

#### Use Case: Iterative Development

When writing experimental rules, it's common to accidentally create "infinite" loops or extremely hard sub-problems. Setting a low timeout (e.g., 2-3 seconds) allows you to "fail fast" and iterate quickly without waiting for the browser to become unresponsive.

#### Note on Recovery

As noted, the browser might stay sluggish for a few moments after a timeout as it cleans up the WASM worker memory. If the UI remains frozen, a page refresh is the most reliable way to restore performance.

