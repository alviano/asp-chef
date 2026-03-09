The **Merge** operation combines all models in a single model.

Each model in input is encoded by a sequence of facts of the form
```asp
__model__(INDEX).
__model__(INDEX, ATOM).
```
where `INDEX` is an identifier for the model (starting from 1) and `ATOM` is an atom in the model.

The name of the binary predicate `__model__` can be specified in the recipe.

§§§§

This operation is a powerful tool for meta-reasoning across multiple solutions. It transforms a stream of independent models into a single data structure that ASP rules can analyze.

#### Why use Merge?

Standard ASP solving (like in **Search Models**) processes one model at a time. This means you cannot write a rule that compares "Model 1" with "Model 2". By using **Merge**, you bring all solutions into a single model, allowing you to reason about the entire solution set.

#### Common Use Cases

1.  **Solution Comparison**: Find atoms that are common to all models or identify differences between them.
2.  **Aggregation**: Calculate statistics across models (e.g., counting how many solutions have a specific property).
3.  **Complex Encodings**: Prepare data for operations that expect a single input model but require information from multiple sources.

#### Format Details

- `__model__(INDEX)`: A unary fact indicating that a model with that index exists.
- `__model__(INDEX, ATOM)`: A binary fact wrapping an original atom from model `INDEX`.

After merging, you can write rules like:
```asp
% Find atoms that appear in both model 1 and model 2
common(Atom) :- __model__(1, Atom), __model__(2, Atom).
```

#### Reversing the Merge

To turn a merged model back into separate models (after processing), use the **Split** operation.

