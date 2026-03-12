The **@dumbo/SDL** operation rewrites the Structured Declarative Language (SDL) program stored in `__program__` into an equivalent ASP version.

§§§§

This operation bridges the gap between Structured Declarative Language (SDL) and standard Answer Set Programming (ASP).

#### What is SDL?

Structured Declarative Language is a higher-level abstraction designed to make ASP programs more manageable and readable. It introduces structural elements that help organize rules and data.

#### How it works

The **SDL** ingredient acts as a compiler and translator.
1. It identifies the SDL program within your model (usually stored as a Base64-encoded string in the `__program__` predicate).
2. It sends this program to the Dumbo backend service.
3. The service parses the SDL and rewrites it into equivalent, standard ASP rules that Clingo can understand.
4. The resulting ASP code is re-encoded and returned to the model, replacing the original SDL facts.

#### Why use SDL?

- **Readability**: SDL provides a cleaner syntax for complex rule sets.
- **Maintainability**: Large projects benefit from the structural features of SDL.
- **Portability**: By translating into standard ASP, you can leverage the full ecosystem of ASP solvers while developing in a more modern language.

#### Integration

After the **SDL** operation has performed the rewrite, you typically follow it with a **Search Models** or **Optimize** ingredient to execute the translated ASP code.
