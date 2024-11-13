The **Javascript** operation executes Javascript code over the `input` models.

A function with arguments `input` and `options`, and the provided code is created and run in a worker. It must return an array of arrays of objects, where each object has the `str` property (which must be a parsable atom). Auxiliary functions can be defined within the code given in the ingredient.

If `options` is `"DESCRIBE"`, the function must return an object with properties `name`, `doc` and `options`, where `options` is an array of strings of the form `OPTION_NAME|TYPE|PLACEHOLDER|DEFAULT_VALUE`. It is also acceptable to return just the array of options. `TYPE` must be one of {TYPES.join(', ')}.

If the worker is terminated while executing the code given in the ingredient (for example, due to a change in the recipe), an `Error: Terminated` is reported.

The _input_ is an array of models. A _model_ is an array of atoms.  
An _atom_ is an object with properties `predicate` (a string), `terms` (an array of terms) and `str` (a string).  
A _term_ is an object with property `str` (the string representation of the term) and one of the following properties: `number`, `string`, `functor` (a string; in this case there is also a property `terms`).

**Important!** The Javascript code is run in an isolated worker and cannot access any library imported by ASP Chef. Dynamic imports are permitted. For example, _lodash_ can be imported using  
`const _ = (await import("https://esm.run/lodash")).default;`
