The **Expand Mustache Queries** operation calls applies all *mustache queries* occurring in a Base64-encoded string.

Mustache queries (or directives) have the form 
`{{ program with #show directives }}`
(or `{{= (terms) : conjunctive_query }}` as a shortcut for `{{ #show (terms) : conjunctive_query. }}`).

The model in which the mustache query occur is queried accordingly, and the result replaces the mustache query in the Base64-encoded string.

In each mustache query, the output can be ordered via the varadics predicate `sort`, specifying the indices of the terms to use (positive for ascending, negative for descending).

The separator of the obtained substitutions can be specified with `separator("\n")`. Similarly, `term_separator/1`, `prefix/1` and `suffix/1` can be used to customize the print of each obtained substitution.

To account for duplicates, as ASP has a set-semantics, the predicate `show` can be used:
`show(f(terms), ...)` will be expanded to `f(terms)` (properly interpreted), and the extra terms in `...` are discarded. 

Tree-like data structures can be processed using the `tree` predicate:
- `tree(ID, root(NODE), children_on("{CHILDREN}"), separator(", "))` to produce in output the tree identified by `ID`, rooted at `NODE`, with children placed on the first occurrence of `{CHILDREN}` and separated by `, `; `children_of` and `separator` are optional. 
- `tree(ID, node(NODE, "STRING REPRESENTATION")` to format the `NODE`.
- `tree(ID, link(PARENT, CHILD))` to specify links.

To ease the application of several queries with the same separators (or other atoms/terms), it is possible to add elements to a persistent array using 
`{{+ (terms) : conjunctive_query }}` or
`{{* program with #show directives }}`.
The same array can be reset to the empty array using 
`{{-}}` (no query within such curly brackets is permitted).

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

Finally, it is possible to use `{{"MULTILINE STRING!"}}` and `{f{"MULTILINE ${FORMAT} STRING!"}}`, described in the extended docs.

§§§§

Let's start from the example in the **Tabulator** docs:
```javascript
{{+ separator(", ") }}

{
  height:205,
  data:[
    {{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
  ],
  layout:"fitColumns",
  columns:[ 
    {title: "Name", field: "name", width: 150},
    {title: "Age", field: "age", hozAlign: "left", formatter: "progress"},
    {title: "Favourite Color", field: "col"},
    {title: "Date Of Birth", field: "dob", sorter: "date", hozAlign: "center"},
  ],
}
```
It uses a format string to provide JSON objects:
```javascript
    {{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
```
Let's improve the above line with a *multiline* string:
```javascript
    {{= @string_format({{"{
      id: %d, 
      name: '%s', 
      age: %d, 
      col: '%s', 
      dob: '%s'
    }"}}, Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
```
Even better, we can use a *formatted multiline*:
```javascript
    {{= {{f"{
      id: ${Id:%5d}, 
      name: '${Name}', 
      age: ${Age}, 
      col: '${Color}', 
      dob: '${DoB}'
    }"}} : data(Id, Name, Age, Color, DoB) }}
```
Note that above we used `${Id:%5d}` to showcase the possibility of using string formatters (supported by Lua).
If not specified, the f-multiline mustache uses `%s` as default.