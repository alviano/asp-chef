The **Slider** operation extends input models with a new fact storing the given integer.

The range of selectable values can be specified by means of constants or by (the first argument of) a predicate. If predicates are used, the extreme values among all models in input are used.

§§§§

This operation provides an interactive range input directly in your recipe, allowing you to parameterize your logic with user-selected numbers.

#### How it works

The **Slider** ingredient displays a horizontal slider in the UI. When you move the slider, it updates a specific integer fact in your models.
- **Output Predicate**: The name of the fact added to the model (default: `__slider__`).
- **Value**: The current selection becomes the first argument of the fact: `__slider__(VALUE).`.

#### Dynamic Ranges

You can define the slider's **Min** and **Max** values in two ways:
1.  **Static Constants**: Manually enter numbers in the ingredient options.
2.  **Dynamic Predicates**: Specify a predicate name. The operation will automatically find the minimum and maximum values of the first arguments of that predicate across all input models. This is useful for creating a slider that adapts to the data (e.g., sliding through years found in a dataset).

#### Use Case: Interactive Querying

Use the slider to filter or change the behavior of your subsequent ASP rules:
```asp
% Logic
selected_year(Y) :- __slider__(Y).
active_person(X) :- person(X, BirthYear), selected_year(Y), BirthYear <= Y.
```
Moving the slider will trigger a re-solving of the recipe, updating the visualization based on the new "age" threshold.

