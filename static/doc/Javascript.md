The **Javascript** operation executes Javascript code over the `input` models.

A function with arguments `input` and `options`, and the provided code is created and run in a worker. It must return an array of arrays of objects, where each object has the `str` property (which must be a parsable atom). Auxiliary functions can be defined within the code given in the ingredient.

If `options` is `"DESCRIBE"`, the function must return an object with properties `name`, `doc` and `options`, where `options` is an array of strings of the form `OPTION_NAME|TYPE|PLACEHOLDER|DEFAULT_VALUE`.
It is also acceptable to return just the array of options. `TYPE` must be one of
bool,
color,
date,
datetime-local,
email,
month,
number,
password,
range,
search,
tel,
text,
time,
url,
week.

If the worker is terminated while executing the code given in the ingredient (for example, due to a change in the recipe), an `Error: Terminated` is reported.

The _input_ is an array of models. A _model_ is an array of atoms.  
An _atom_ is an object with properties `predicate` (a string), `terms` (an array of terms) and `str` (a string).  
A _term_ is an object with property `str` (the string representation of the term) and one of the following properties: `number`, `string`, `functor` (a string; in this case there is also a property `terms`).

**Important!** The Javascript code is run in an isolated worker and cannot access any library imported by ASP Chef. Dynamic imports are permitted. For example, _lodash_ can be imported using  
`const _ = (await import("https://esm.run/lodash")).default;`

§§§§

This operation is the ultimate "Swiss Army Knife" of ASP-chef. It allows you to perform any computation that is difficult in pure ASP using the full power of JavaScript.

#### Input Structure

The `input` is mapped to an array of models:
```javascript
[
  [ // Model 1
    { predicate: 'p', terms: [{ number: 1, str: '1' }], str: 'p(1)' },
    { predicate: 'q', terms: [{ string: 'a', str: '"a"' }], str: 'q("a")' }
  ],
  [ // Model 2
    { predicate: 'p', terms: [{ number: 2, str: '2' }], str: 'p(2)' }
  ]
]
```

#### Output Structure

Your code **must** return an array of models, where each model is an array of atom objects (or objects with a `str` property):
```javascript
return [
  [ { str: 'result(100)' }, { str: 'result(200)' } ], // Model 1
  [ { str: 'result(300)' } ] // Model 2
];
```

#### Example: Calculating a Sum

To sum up all values of `val(X)` for each model:
```javascript
return input.map(model => {
  const sum = model
    .filter(atom => atom.predicate === 'val')
    .reduce((acc, atom) => acc + atom.terms[0].number, 0);
  return [{ str: `total(${sum})` }];
});
```

#### Defining Custom Options

You can define options that appear in the ingredient's UI. When `options` is `"DESCRIBE"`, return an object:
```javascript
if (options === "DESCRIBE") {
  return {
    name: "My Custom Operation",
    options: ["Multiplier|number|multiplier|1"]
  };
}
// Normal execution
const mult = options.multiplier;
// ...
```
The ingredient will show a number input for "Multiplier" with a default value of 1, whose value is stored in the `multiplier` option.

#### Advanced Usage: External Libraries

Since the code runs in a Web Worker, you can't use `require()`. Instead, use dynamic `import()`:
```javascript
const moment = (await import("https://esm.run/moment")).default;
const now = moment().format('YYYY-MM-DD');
return [[{ str: `date("${now}")` }]];
```

