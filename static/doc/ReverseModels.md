The **Reverse Models** operation reverses the models in input.

The last model becomes the first and so on.

§§§§

This operation reorders the sequence of models in the input stream (rather than the atoms within them).

#### How it works

The operation uses an internal reverse function (from **lodash**) on the list of models. For example:
- Initial sequence: `[Model 1, Model 2, Model 3]`
- After **Reverse Models**: `[Model 3, Model 2, Model 1]`

#### Use Cases: Solving Order

A common use case is with operations that return many solutions (like **Search Models** or **Optimize**) where you want to see the *last* model(s) first.

- **Optimization**: Frequently, solvers like Clingo might yield better (more optimal) results later in their run. Reversing the models lets you quickly inspect the most recent (and likely more optimal) solution found.
- **Selective Display**: If you follow this with a **Select Model** ingredient, you can easily isolate the very last model in the sequence.

#### Difference with Sort

Unlike **Sort by Predicate or Argument** or **Sort Models Canonically**, which reorder models based on their **content**, **Reverse Models** only cares about their **original position** in the input list.

