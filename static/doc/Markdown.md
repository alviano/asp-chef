The **Markdown** operation shows the markdown encoded content in each model in input. Latex math expressions are supported; e.g., `\\(x = 4\\)` or `\\[x = 4\\]`.

Models can be queried with the mustache syntax 
`{{ program with #show directives }}`
(or `{{= (terms) : conjunctive_query }}` as a shortcut for `{{ #show (terms) : conjunctive_query. }}`).

Output can be ordered via the varadics predicate `sort`, specifying the indices of the terms to use (positive for ascending, negative for descending).

The separator of the obtained substitutions can be specified with `separator("\n")`. Similarly, `term_separator/1`, `prefix/1` and `suffix/1` can be used to customize the print of each obtained substitution.

Tables can be specified by the varadics predicates `th` and `tr`. Alignment of columns (by default left) can be specified in `th` by terms `left("column header")`, `center("col")`, `right("col")`. Alternatively, `matrix/3` can be used to produce a table by specifying values for each cell. Row 0 can be used to provide header cells. Columns are indexed by 1.

Ordered and unordered lists can be specified by the varadics predicates `ol` and `ul`.

Predicates `png/1`, `gif/1` and `jpeg/1` can be used to show a Base64-encoded image.

Predicate `base64/1` decodes Base64-encoded content.

Predicate `qrcode/1` (and links `[...](qrcode)`) are shown as QR-codes.

The input is echoed in output.

§§§§

This operation is the primary way to create human-readable reports and rich interactive dashboards directly from your ASP models.

#### Mustache Templates

You can embed logic queries inside your Markdown using simple double-brace syntax.

**Example: Enumerating facts**
If your model contains `person("Alice")` and `person("Bob")`:
```markdown
### List of Users
{{= X : person(X) }}
```
*Result:*
### List of Users
Alice
Bob

#### Building Tables

Use the `th` and `tr` predicates to build complex tables.

**Example: Employee Table**
```asp
% Logic
th(left("Name"), center("Age")).
tr("Alice", 30).
tr("Bob", 25).
```
The **Markdown** ingredient will automatically render these atoms as a formatted table.

#### Dynamic Images and QR Codes

- **Images**: If you have a Base64-encoded image in your model (e.g., from an external fetch), wrap it in `png(BASE64)`, `gif(BASE64)`, or `jpeg(BASE64)` to display it.
- **QR Codes**: Any text wrapped in `qrcode("text")` will be rendered as a QR code. Markdown links can also use this feature: `[My Secret](qrcode)`.

#### Math and Formatting

Standard Markdown formatting (bold, italics, links) works normally. For mathematical formulas, use LaTeX syntax enclosed in backslashes and parentheses/brackets.

