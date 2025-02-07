The **Expand Mustache Queries** operation calls applies all *mustache queries* occurring in a Base64-encoded string.

Mustache queries (or directives) have the form 
`{{ program with #show directives }}`
(or `{{= (terms) : conjunctive_query }}` as a shortcut for `{{ #show (terms) : conjunctive_query. }}`).

The model in which the mustache query occur is queried accordingly, and the result replaces the mustache query in the Base64-encoded string.

In each mustache query, the output can be ordered via the varadics predicate `sort`, specifying the indices of the terms to use (positive for ascending, negative for descending).

The separator of the obtained substitutions can be specified with `separator("\n")`. Similarly, `term_separator/1`, `prefix/1` and `suffix/1` can be used to customize the print of each obtained substitution.

To account for duplicates, as ASP has a set-semantics, the predicate `show` can be used:
`show(f(terms), ...)` will be expanded to `f(terms)` (properly interpreted), and the extra terms in `...` are discarded. 

Other predicates are thought to be coupled with **Markdown** ingredients.
They are described next.

Tables can be specified by the varadics predicates `th` and `tr`. 
Alignment of columns (by default left) can be specified in `th` by terms `left("column header")`, `center("col")`, `right("col")`. 
Alternatively, `matrix/3` can be used to produce a table by specifying values for each cell. 
Row 0 can be used to provide header cells. 
Columns are indexed by 1.

Ordered and unordered lists can be specified by the varadics predicates `ol` and `ul`.

Predicates `png/1`, `gif/1` and `jpeg/1` can be used to show a Base64-encoded image.

Predicate `base64/1` decodes Base64-encoded content.

Predicate `qrcode/1` (and links `[...](qrcode)`) are shown as QR-codes.

Mustache queries have access to the **Lua Chef Library**.
Check details in the following operations:
- **Lua Expression @-terms**
- **Lua String @-terms**
