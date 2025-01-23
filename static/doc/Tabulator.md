The **Tabulator** operation shows input models in tables powered by the Tabulator framework.

Tables are obtained from instances of `__tab__/1` (which can be echoed in the output).

The term of each `__tab__/1` instance is of one of the following forms:
- `config(terms)` to configure the table;
- `column(index, terms)` or `col(index, terms)` to set up columns;
- `(terms)` to provide rows.

Configuration terms are `key(value)` options for the table.

The first column term is the index of the column (1-indexed), and the other column terms are `key(value)` options for the column.

Row terms are data to be shown in a row of the table. 

Values can be (double-quoted) strings, numbers or functions.
Some functors have a special meaning:
- `json(content)`: the content is interpreted as a JSON object (double-quotes must be escaped);
- `json'(content)`: single quotes in the content are first replaced by double-quotes, and the content is interpreted as a JSON object.

The input is echoed in output.
It's possible to show/hide the index of the model above each table.

Check https://tabulator.info/ for possible values and for taking inspiration!

§§§§

Example input:
```asp
__tab__(config(
  rowHeader(undefined)  % disable row indices
)).

__tab__(column(1,
  title("Person"),
  sorter(string),
  hozAlign(right),
  width(200)
)).
__tab__(column(2,
  title("Age"),
  sorter(number),
  hozAlign(right),
  headerSort(false)  % disable sort by age
)).

person(alice, 25).
person(bob, 30).
person(carol, 22).

__tab__((Name,Age)) :- person(Name, Age).
```