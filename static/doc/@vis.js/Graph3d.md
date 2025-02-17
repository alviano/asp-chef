The **@vis.js/Graph3d** operation shows input models as animated 3d charts using the Vis.js framework.

Charts are obtained from instances of `__vis__/1` (which can be echoed in the output).

The term of each `__vis__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Vis.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://visjs.org/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the Vis.js website.
For example, let's consider a *custom 3d graph*:
https://visjs.github.io/vis-graph3d/examples/graph3d/10_styling.html

We have to adapt the `data` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  data: [
    {"x":0,"y":0,"z":10},
    {"x":0,"y":2,"z":10},
    {"x":0,"y":4,"z":10},
    {"x":0,"y":6,"z":10},
    {"x":0,"y":8,"z":10},
    {"x":0,"y":10,"z":10},
    {"x":2,"y":0,"z":4.055192314751778},
    {"x":2,"y":2,"z":5.219721713361852},
    {"x":2,"y":4,"z":8.257070181339374},
    {"x":2,"y":6,"z":11.977264292442078},
    {"x":2,"y":8,"z":14.92280511977767},
    {"x":2,"y":10,"z":15.9396876660944},
    {"x":4,"y":0,"z":0.4394434267237042},
    {"x":4,"y":2,"z":2.3122624960911518},
    {"x":4,"y":4,"z":7.19698600580393},
    {"x":4,"y":6,"z":13.179875301117043},
    {"x":4,"y":8,"z":17.91695195853648},
    {"x":4,"y":10,"z":19.552322457831682},
    {"x":6,"y":0,"z":0.569332677430527},
    {"x":6,"y":2,"z":2.4167077191657818},
    {"x":6,"y":4,"z":7.235067615868823},
    {"x":6,"y":6,"z":13.136673671898329},
    {"x":6,"y":8,"z":17.809392639171055},
    {"x":6,"y":10,"z":19.422545075411726},
    {"x":8,"y":0,"z":4.393972011607859},
    {"x":8,"y":2,"z":5.492137797208197},
    {"x":8,"y":4,"z":8.356395385260182},
    {"x":8,"y":6,"z":11.864584953922835},
    {"x":8,"y":8,"z":14.642266788773577},
    {"x":8,"y":10,"z":15.601199746303056},
    {"x":10,"y":0,"z":10.414942916985868},
    {"x":10,"y":2,"z":10.333659677702261},
    {"x":10,"y":4,"z":10.121655135262209},
    {"x":10,"y":6,"z":9.86198850213543},
    {"x":10,"y":8,"z":9.656392061054836},
    {"x":10,"y":10,"z":9.585414456338079}
  ],
  options: {
    width:  '600px',
    height: '600px',
    style: 'bar',
    xBarWidth: 1,
    yBarWidth: 1,
    showPerspective: true,
    showGrid: true,
    showShadow: false,
    keepAspectRatio: true,
    verticalRatio: 0.5
  },
}
```

If we provide the above content in an **Encode** ingredient with predicate `__vis__`, and after that we add an **@vis.js/Graph3d** ingredient, we obtain a *3d animated graph* visualization.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% data: X, Y, Z
data(0,0,10).
data(0,2,10).
data(0,4,10).
data(0,6,10).
data(0,8,10).
data(0,10,10).
data(2,0,real("4.055192314751778")).
data(2,2,real("5.219721713361852")).
data(2,4,real("8.257070181339374")).
data(2,6,real("11.977264292442078")).
data(2,8,real("14.92280511977767")).
data(2,10,real("15.9396876660944")).
data(4,0,real("0.4394434267237042")).
data(4,2,real("2.3122624960911518")).
data(4,4,real("7.19698600580393")).
data(4,6,real("13.179875301117043")).
data(4,8,real("17.91695195853648")).
data(4,10,real("19.552322457831682")).
data(6,0,real("0.569332677430527")).
data(6,2,real("2.4167077191657818")).
data(6,4,real("7.235067615868823")).
data(6,6,real("13.136673671898329")).
data(6,8,real("17.809392639171055")).
data(6,10,real("19.422545075411726")).
data(8,0,real("4.393972011607859")).
data(8,2,real("5.492137797208197")).
data(8,4,real("8.356395385260182")).
data(8,6,real("11.864584953922835")).
data(8,8,real("14.642266788773577")).
data(8,10,real("15.601199746303056")).
data(10,0,real("10.414942916985868")).
data(10,2,real("10.333659677702261")).
data(10,4,real("10.121655135262209")).
data(10,6,real("9.86198850213543")).
data(10,8,real("9.656392061054836")).
data(10,10,real("9.585414456338079")).
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  data: [
    {{= @string_format("{x: %s, y: %s, z: %s}", X,Y,Z) : data(X,Y,Z) }}
  ],
  options: {
    width:  '600px',
    height: '600px',
    style: 'bar',
    xBarWidth: 1,
    yBarWidth: 1,
    showPerspective: true,
    showGrid: true,
    showShadow: false,
    keepAspectRatio: true,
    verticalRatio: 0.5
  },
}
```

Note that we are using **mustache queries** to take data from the input model.
