The **@vis.js/Network** operation shows input models as dynamic, automatically organised, customizable network views (aka, graphs) using the Vis.js framework.

Networks are obtained from instances of `__vis__/1` (which can be echoed in the output).

The term of each `__vis__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Vis.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://visjs.org/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the Vis.js website.
For example, let's consider a *network graph* (with groups and shadows):
https://visjs.github.io/vis-network/examples/network/nodeStyles/shadows.html

We have to adapt the `data` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  data: {
    nodes: [
      { id: 0, label: "0", group: 0 },
      { id: 1, label: "1", group: 0 },
      { id: 2, label: "2", group: 0 },
      { id: 3, label: "3", group: 1 },
      { id: 4, label: "4", group: 1 },
      { id: 5, label: "5", group: 1 },
      { id: 6, label: "6", group: 2 },
      { id: 7, label: "7", group: 2 },
      { id: 8, label: "8", group: 2 },
      { id: 9, label: "9", group: 3 },
      { id: 10, label: "10", group: 3 },
      { id: 11, label: "11", group: 3 },
      { id: 12, label: "12", group: 4 },
      { id: 13, label: "13", group: 4 },
      { id: 14, label: "14", group: 4 }, 
      { id: 15, label: "15", group: 5 },
      { id: 16, label: "16", group: 5 },
      { id: 17, label: "17", group: 5 },
      { id: 18, label: "18", group: 6 },
      { id: 19, label: "19", group: 6 },
      { id: 20, label: "20", group: 6 },
      { id: 21, label: "21", group: 7 },
      { id: 22, label: "22", group: 7 },
      { id: 23, label: "23", group: 7 },
      { id: 24, label: "24", group: 8 },
      { id: 25, label: "25", group: 8 },
      { id: 26, label: "26", group: 8 },
      { id: 27, label: "27", group: 9 },
      { id: 28, label: "28", group: 9 },
      { id: 29, label: "29", group: 9 },
    ],
    edges: [
      { from: 1, to: 0 },
      { from: 2, to: 0 },
      { from: 4, to: 3 },
      { from: 5, to: 4 },
      { from: 4, to: 0 },
      { from: 7, to: 6 },
      { from: 8, to: 7 },
      { from: 7, to: 0 },
      { from: 10, to: 9 },
      { from: 11, to: 10 },
      { from: 10, to: 4 },
      { from: 13, to: 12 },
      { from: 14, to: 13 },
      { from: 13, to: 0 },
      { from: 16, to: 15 },
      { from: 17, to: 15 },
      { from: 15, to: 10 },
      { from: 19, to: 18 },
      { from: 20, to: 19 },
      { from: 19, to: 4 },
      { from: 22, to: 21 },
      { from: 23, to: 22 },
      { from: 22, to: 13 },
      { from: 25, to: 24 },
      { from: 26, to: 25 },
      { from: 25, to: 7 },
      { from: 28, to: 27 },
      { from: 29, to: 28 },
      { from: 28, to: 0 },      
    ]    
  },
  options: {
    nodes: {
      shape: "dot",
      size: 30,
      font: {
        size: 32,
      },
      borderWidth: 2,
      shadow: true,
    },
    edges: {
      width: 2,
      shadow: true,
    },
  }
}
```

If we provide the above content in an **Encode** ingredient with predicate `__vis__`, and after that we add an **@vis.js/Network** ingredient, we obtain a *network graph*.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% node: ID, GROUP
node(0,0).
node(1,0).
node(2,0).
node(3,1).
node(4,1).
node(5,1).
node(6,2).
node(7,2).
node(8,2).
node(9,3).
node(10,3).
node(11,3).
node(12,4).
node(13,4).
node(14,4).
node(15,5).
node(16,5).
node(17,5).
node(18,6).
node(19,6).
node(20,6).
node(21,7).
node(22,7).
node(23,7).
node(24,8).
node(25,8).
node(26,8).
node(27,9).
node(28,9).
node(29,9).

% link: FROM, TO
% node: ID, GROUP
node(0,0).
node(1,0).
node(2,0).
node(3,1).
node(4,1).
node(5,1).
node(6,2).
node(7,2).
node(8,2).
node(9,3).
node(10,3).
node(11,3).
node(12,4).
node(13,4).
node(14,4).
node(15,5).
node(16,5).
node(17,5).
node(18,6).
node(19,6).
node(20,6).
node(21,7).
node(22,7).
node(23,7).
node(24,8).
node(25,8).
node(26,8).
node(27,9).
node(28,9).
node(29,9).

% link: FROM, TO
link(1,0).
link(2,0).
link(4,3).
link(5,4).
link(4,0).
link(7,6).
link(8,7).
link(7,0).
link(10,9).
link(11,10).
link(10,4).
link(13,12).
link(14,13).
link(13,0).
link(16,15).
link(17,15).
link(15,10).
link(19,18).
link(20,19).
link(19,4).
link(22,21).
link(23,22).
link(22,13).
link(25,24).
link(26,25).
link(25,7).
link(28,27).
link(29,28).
link(28,0).
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  data: {
    nodes: [
      {{= @string_format("{ id: %d, label: '%d', group: %d }", X, X, G) : node(X,G) }}
    ],
    edges: [
      {{= @string_format("{ from: %d, to: %d }", X,Y) : link(X,Y) }}
    ],
  },
  options: {
    nodes: {
      shape: "dot",
      size: 30,
      font: {
        size: 32,
      },
      borderWidth: 2,
      shadow: true,
    },
    edges: {
      width: 2,
      shadow: true,
    },
  },
}
```

Note that we are using **mustache queries** to take data from the input model.
