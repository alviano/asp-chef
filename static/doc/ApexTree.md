The **ApexTree** operation shows input models in trees powered by the ApexTree framework.

Trees are obtained from instances of `__tree__/1` (which can be echoed in the output).

The term of each `__tree__/1` instance is a Base64-encoded string, possibly including mustache queries (very likely using the `tree` atom).
It will be interpreted as a (relaxed) JSON object, and used to configure the ApexCharts object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://apexcharts.com/apextree/demos/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the ApexTree website.
For example, let's consider an the *Dynamic view change* example:
https://apexcharts.com/apextree/demos/dynamic-view-change/

We have to adapt the `data` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  data: {
    id: 'Species',
    name: 'Species',
    children: [
      {
        id: '2',
        name: 'Plants',
        children: [
          {
            id: '3',
            name: 'Mosses',
          },
          {
            id: '4',
            name: 'Ferns',
          },
        ],
      },
      {
        id: '8',
        name: 'Fungi',
      },
      {
        id: '9',
        name: 'Lichens',
      },
      {
        id: '10',
        name: 'Animals',
        children: [
          {
            id: '11',
            name: 'Invertebrates',
            children: [
              {
                id: '12',
                name: 'Insects',
              },
            ],
          },
          {
            id: '16',
            name: 'Vertebrates',
            children: [
              {
                id: '17',
                name: 'Fish',
              },
              {
                id: '19',
                name: 'Reptiles',
              },
            ],
          },
        ],
      },
    ],
  },
  options: {
    contentKey: 'name',
    width: 800,
    height: 700,
    nodeWidth: 150,
    nodeHeight: 50,
    childrenSpacing: 150,
    siblingSpacing: 30,
    direction: 'top',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontColor: '#a06dcc',
    borderWidth: 2,
    borderColor: '#a06dcc',
    canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
  }
}
```
Note that the tree is represented by a Javascript object, reflecting the recursive structure of the tree.
If we provide the above content in an **Encode** ingredient with predicate `__tree__`, and after that we add a **ApexTree** ingredient, we obtain a nice visualization.

However, it can be more interesting to take data from the input model.
The main difficulty is to adapt the relational format of ASP facts to the recursive representation used by **ApexTree**.
We can take advantage of the `tree` predicate of **mustache queries**.
Let's say we have the following input:
```asp
                    node(root, "Species").
  tree(root, 2).    node(2, "Plants").
    tree(2, 3).     node(3, "Mosses").
    tree(2, 4).     node(4, "Ferns").
  tree(root, 8).    node(8, "Fungi").
  tree(root, 9).    node(9, "Lichens").
  tree(root, 10).   node(10, "Animals").
    tree(10, 11).   node(11, "Invertebrates").
      tree(11, 12). node(12, "Insects").
    tree(10, 16).   node(16, "Vertebrates").
      tree(16, 17). node(17, "Fish").
      tree(16, 19). node(19, "Reptiles").
```

Modify the **Encode** ingredient as follows: 
```javascript
{
  data: {{
    #show tree(my_tree, root(Node)) : tree(Node,_), not tree(_,Node).
    #show tree(my_tree, node(Node, @string_format("{id: '%s', name: '%s', children: [{CHILDREN}] }", Node, Name))) : node(Node,Name).
    #show tree(my_tree, link(A,B)) : tree(A,B).
  }},
  options: {
    contentKey: 'name',
    width: 800,
    height: 700,
    nodeWidth: 150,
    nodeHeight: 50,
    childrenSpacing: 150,
    siblingSpacing: 30,
    direction: 'top',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontColor: '#a06dcc',
    borderWidth: 2,
    borderColor: '#a06dcc',
    canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
  }
}
```

Note that we are using the `tree` predicate in the **mustache query** to take data from the input model and shape them as a tree.
