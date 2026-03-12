The **Set Configuration** operation sets the default configuration of clingo.

Possible values:
- `auto`: Select configuration based on problem type
- `frumpy`: Use conservative defaults
- `jumpy`: Use aggressive defaults
- `tweety`: Use defaults geared towards asp problems
- `handy`: Use defaults geared towards large problems
- `crafty`: Use defaults geared towards crafted problems
- `trendy`: Use defaults geared towards industrial problems
- `many`: Use default portfolio to configure solver(s)

§§§§

This operation allows you to tune Clingo's internal heuristics and solving parameters using pre-defined portfolios.

#### Why change the configuration?

Different logic programs have different characteristics. A configuration that works well for a small combinatorial puzzle might not be efficient for a large industrial scheduling problem. By selecting a specialized configuration, you can significantly reduce the solving time.

#### Configuration Profiles

*   **tweety**: Often the best starting point for standard ASP problems.
*   **handy/trendy**: Geared towards industrial and large-scale instances where the search space is vast.
*   **crafty**: Good for "hand-crafted" puzzles and mathematical problems.
*   **jumpy/frumpy**: Represent different trade-offs between aggressive search and conservative memory/time usage.

#### Global Impact

The selected configuration is applied globally to all solver-based ingredients (like **Search Models**, **Optimize**, and **Intersection**) that follow this ingredient in the recipe. It is usually placed at the beginning of a recipe to ensure consistent performance throughout the pipeline.

