The **@dumbo/PyQASP** operation invokes the [PyQASP](https://github.com/MazzottaG/PyQASP) solver with the program Base64-encoded in `__program__/1`.

This operation requires the [ASP Chef CLI](https://github.com/alviano/asp-chef-cli) and a local server (e.g., `python -m asp_chef_cli server`).
The binary `pyqasp` must be in the PATH.

§§§§

A simple way to go is to use an __Encode__ operation to store the program:
```asp
%@exists
{a;b;c}.
%@forall
{d;e}.

f:-not g,a.
h:-not f,b.
g:-not h,c.

%@constraint
:-f.
:-g.
```

Be sure to use `__program__` as _Predicate_!

After that, add a **@dumbo/PyQASP** ingredient and enable _enumeration_ to obtain the following output:
```asp
EMPTY MODEL
§
b.
§
b.
c.
§
a.
b.
c.
```

Interleave an **Expand Mustache Queries** to combine facts in the interpretations in input with the program given in the **Encode** ingredient.
For example, if existential and universal atoms are determined from the input (possibly after some computation), the following template can be used:
```asp
{{+ separator(";") }}

%@exists
{
  {{= (X,) : exist(X) }}
}.
%@forall
{
  {{= (X,) : all(X) }}
}.

f:-not g,a.
h:-not f,b.
g:-not h,c.

%@constraint
:-f.
:-g.
```
Applying the template against the input
```asp
exist(a;b;c).
all(d;e).
```
renders the first example above.