The **Parse CSV** operation maps constants to facts.

Each constant value `v` in row `r` and column `c` is mapped to fact `__cell__(r,c,v).`

The name of the ternary predicate `__cell__` can be specified in the recipe.

§§§§

This operation is used to transform comma-separated data into a format that ASP can reason about.

#### How it works

The operation takes each model in the input (which is usually a single model containing a single constant—the CSV text).
1. It parses the text as a CSV (standard format with delimiter and quoting supported).
2. For each cell, it generates a fact:
   - **Row Index**: The 1-based index of the row.
   - **Column Index**: The 1-based index of the column.
   - **Value**: The content of the cell (automatically quoted in the ASP fact).

#### Using with Header Rows

If your CSV has a header row, you can write ASP rules to name the columns:
```asp
column_name(C, Name) :- __cell__(1, C, Name).
value(Row, Name, V) :- column_name(C, Name), __cell__(Row, C, V), Row > 1.
```

#### Workflow: External Data Loading

1.  **GitHub**: Fetch a `.csv` file from a repository.
2.  **Parse CSV**: Turn the CSV text into a set of `__cell__` facts.
3.  **Search Models**: Use rules to map the generic cell facts into your domain predicates (e.g., `student(ID, Grade)`).
4.  **Table**: Visualize the original data and your inferences side-by-side.

#### Predicate Customization

You can change the name of the ternary predicate (default: `__cell__`) if you want to distinguish between multiple CSV files parsed within the same model.

