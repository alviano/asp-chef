The **@vis.js/Timeline** operation shows input models as fully customizable, interactive timeline with items and ranges using the Vis.js framework.

Timelines are obtained from instances of `__vis__/1` (which can be echoed in the output).

The term of each `__vis__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Vis.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://visjs.org/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the Vis.js website.
For example, let's consider a *basic timeline*:
https://visjs.github.io/vis-timeline/examples/timeline/basicUsage.html

We have to adapt the `items` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  items: [
    {id: 1, content: 'item 1', start: '2014-04-20'},
    {id: 2, content: 'item 2', start: '2014-04-14'},
    {id: 3, content: 'item 3', start: '2014-04-18'},
    {id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19'},
    {id: 5, content: 'item 5', start: '2014-04-25'},
    {id: 6, content: 'item 6', start: '2014-04-27', type: 'point'}
  ],
  options: {},
}
```

If we provide the above content in an **Encode** ingredient with predicate `__vis__`, and after that we add an **@vis.js/Timeline** ingredient, we obtain a *timeline* visualization.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
item(1). start(1, "2014-04-20"). 
item(2). start(2, "2014-04-14"). 
item(3). start(3, "2014-04-18"). 
item(4). start(4, "2014-04-16"). end(4, "2014-04-19"). 
item(5). start(5, "2014-04-25"). 
item(6). start(6, "2014-04-27"). type(6, "point").
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  items: [
    {{
      #show @string_format("{id: %d, content: 'item %d', start: '%s', end: %s, type: %s }", I, I, S, E, T) : item(I), start(I,S), end(I,E), type(I,T).
      
      end(I,null) :- item(I), #count{E : end(I,E), E != null} = 0.
      type(I,null) :- item(I), #count{T : type(I,T), T != null} = 0.
    }}
  ],
  options: {},
}

```

Note that we are using **mustache queries** to take data from the input model.
In particular, note that we are computing default values (`null`) for optional properties, and we are taking advantage of relaxed JSON (`end` and `type` values are not quoted).
