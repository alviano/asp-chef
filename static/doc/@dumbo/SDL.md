The **@dumbo/SDL** operation translates a Structured Declarative Language (SDL) program stored in the `__program__` predicate into an equivalent logic program optimized for downstream solvers.

This operation bridges the gap between high-level structural modeling and low-level declarative solving.

§§§§

### What is SDL?

Structured Declarative Language (SDL) is a higher-level abstraction layer built over declarative paradigms. Standard Answer Set Programming (ASP) or Constraint Programming (CP) can become unmanageable as rule sets scale. SDL introduces structural elements that organize data, modules, and constraints into a clean, modern syntax without sacrificing declarative power.

### How It Works

The **SDL** ingredient acts as an automated compiler and translator within your pipeline:

1. **Ingestion**: It extracts the SDL program from your model, where it is typically stored as a Base64-encoded string inside the `__program__` predicate.
2. **Translation**: The program is sent to the Dumbo backend service, which parses the high-level structures.
3. **Target Compilation**: By default, the service rewrites the logic into standard **ASP rules**. Alternatively, the operation can target **MiniZinc**.
4. **Re-encoding**: The resulting target code is re-encoded into Base64 and injected back into the model, cleanly replacing the original SDL facts.

### Why Use SDL?

* **Readability**: Keeps complex rule sets clear and highly legible.
* **Maintainability**: Structural features make large-scale projects easier to debug and scale over time.
* **Flexibility**: By changing a single option, you can compile the exact same high-level logic into either ASP or MiniZinc, allowing you to benchmark different solver ecosystems effortlessly.

### Pipeline Integration

Because the **SDL** operation acts purely as a rewriting step, it does not solve the model itself. To execute the compiled code, you should immediately follow this ingredient with a solver operation tailored to your compilation target:

* For the **ASP** target: Follow with a **Search Models** or **Optimize** ingredient.
* For the **MiniZinc** target: Follow with **MiniZinc** ingredient.