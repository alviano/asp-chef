The **@vis.js/Graph2d** operation shows input models as charts on an interactive timeline using the Vis.js framework.

Charts are obtained from instances of `__vis__/1` (which can be echoed in the output).

The term of each `__vis__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Vis.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://visjs.org/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the Vis.js website.
For example, let's consider a *bar chart*:
https://visjs.github.io/vis-timeline/examples/graph2d/12_customRange.html

We have to adapt the `groups`, `items` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  groups: [
    {id: 0, content: "group0"},
    {id: 1, content: "group1"},
    {id: 2, content: "group2"},
  ],
  items: [
    {x: '2014-06-11', y: 10, group:0},
    {x: '2014-06-12', y: 25, group:0},
    {x: '2014-06-13', y: 30, group:0},
    {x: '2014-06-14', y: 10, group:0},
    {x: '2014-06-15', y: 15, group:0},
    {x: '2014-06-16', y: 30, group:0},
    {x: '2014-06-11', y: 12, group:1},
    {x: '2014-06-12', y: 15, group:1},
    {x: '2014-06-13', y: 34, group:1},
    {x: '2014-06-14', y: 24, group:1},
    {x: '2014-06-15', y: 5, group:1},
    {x: '2014-06-16', y: 12, group:1},
    {x: '2014-06-11', y: 22, group:2},
    {x: '2014-06-12', y: 14, group:2},
    {x: '2014-06-13', y: 24, group:2},
    {x: '2014-06-14', y: 21, group:2},
    {x: '2014-06-15', y: 30, group:2},
    {x: '2014-06-16', y: 18, group:2}
  ],
  options: {
    style:'bar',
    barChart: {width:50, align:'center', sideBySide:true}, // align: left, center, right
    drawPoints: true,
    dataAxis: {
      left: {
        range: {min:-5, max:30}
      },
      right: {
        range: {min:-5}
      },
      icons:true
    },
    orientation:'top',
    start: '2014-06-10',
    end: '2014-06-18',
    height: 500,
  },
}
```

If we provide the above content in an **Encode** ingredient with predicate `__vis__`, and after that we add an **@vis.js/Graph2d** ingredient, we obtain a *bar chart* visualization.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% item: X, Y, GROUP
item("2014-06-11",10,0).
item("2014-06-12",25,0).
item("2014-06-13",30,0).
item("2014-06-14",10,0).
item("2014-06-15",15,0).
item("2014-06-16",30,0).
item("2014-06-11",12,1).
item("2014-06-12",15,1).
item("2014-06-13",34,1).
item("2014-06-14",24,1).
item("2014-06-15",5,1).
item("2014-06-16",12,1).
item("2014-06-11",22,2).
item("2014-06-12",14,2).
item("2014-06-13",24,2).
item("2014-06-14",21,2).
item("2014-06-15",30,2).
item("2014-06-16",18,2).
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  groups: [
    {{= @string_format("{id: %d, content: 'group%d'}", G,G) : item(_,_,G) }}
  ],
  items: [
    {{= @string_format("{x: '%s', y: %d, group: %d}", X,Y,G) : item(X,Y,G) }}
  ],
  options: {
    style:'bar',
    barChart: {width:50, align:'center', sideBySide:true}, // align: left, center, right
    drawPoints: true,
    dataAxis: {
      left: {
        range: {min:-5, max:30}
      },
      right: {
        range: {min:-5}
      },
      icons:true
    },
    orientation:'top',
    start: '2014-06-10',
    end: '2014-06-18',
    height: 500,
  },
}
```

Note that we are using **mustache queries** to take data from the input model.
