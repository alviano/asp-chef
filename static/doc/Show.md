The **Show** operation replaces each model according to the specified `#show` directives.

Each model in input is used as the input of a program given in the recipe.

A program can be specified in general, but the target should be the set of `#show` directives.

§§§§

This operation is a specialized version of **Search Models** focused on projecting or filtering the current model's atoms.

#### Purpose of Show

In ASP, if a program contains no `#show` directives, the solver outputs all true atoms. As soon as you add one `#show`, the solver outputs *only* the specific atoms you've indicated. The **Show** ingredient uses this behavior to let you "clean up" your models before final visualization or processing.

#### How it works

The operation takes the current model as facts and appends the `#show` statements (or rules) you provide in the editor.
It then runs a solver with `Models` set to 1 (calculating brave consequences if multiple models were possible, but typically used for deterministic projection).

#### Examples

1.  **Projecting one predicate**:
    If your model has `person(X)`, `age(X, Y)`, and `city(X, Z)`, but you only want names:
    ```asp
    #show person/1.
    ```
2.  **Creating a new view**:
    You can also provide full rules to transform the data while filtering:
    ```asp
    #show adult(X) : person(X), age(X, Y), Y >= 18.
    ```
    The output model will *only* contain `adult/1` atoms.

#### Why use Show instead of Search Models?

While **Search Models** can also do this, **Show** provides a cleaner semantic intent in your recipe. Use it when you are "formatting" or "selecting" data rather than "solving" a combinatorial problem.

