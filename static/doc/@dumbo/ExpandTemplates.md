The **@dumbo/Expand Templates** operation rewrites the program stored in `__program__` by expanding all applied templates.

The program can apply any core template available in the local server, and also those defined within the program itself.

§§§§

Here is an example involving the computation of all simple paths in a directed graph.
Let's assume the graph is encoded by predicates `vertex/1` and `edge/2`.
For example:
```asp
vertex(1). vertex(2). vertex(3). vertex(4).
edge(1,2). edge(1,3). 
edge(2,1). edge(2,3). 
edge(3,4).
edge(4,1).
```

Let's also bound the length of paths using the `max_length/1` predicate:
```asp
max_length(N) :- N = #count{X : vertex(X)}.
```

We can apply the `@dumbo/all simple directed paths` (use **@dumbo/Template Documentation** for details), which uses the predicates `node/1`, `link/2` and `max_length/1`:
```asp
__apply_template__("@dumbo/all simple directed paths", (node, vertex), (link, edge)).
```
Note that `max_length/1` doesn't need to be renamed, and therefore is not mentioned in the above atom.
As a result, we obtain a program producing all paths in the predicates `path/1` and `in_path/2`.

In more details, let's add the facts encoding the graph to the **Input** panel.
After that, let's use a **Search Models** ingredient with the following content:
```asp
max_length(N) :- N = #count{X : vertex(X)}.
__apply_template__("@dumbo/all simple directed paths", (node, vertex), (link, edge)).
```
We can now encode the model with **Encode Input** and use **@dumbo/Expand Templates** (linking the two ingredients with the same predicate, e.g., `__program__`) to obtain a larger program to compute all paths in the graph.
Finally, we can use **Search Models** (again, linking it to the previous ingredients decoding predicate `__program__`) to actually obtain all paths in the graph.