The **Fabric.js** operation shows input models in canvas powered by the Fabric.js framework.

Canvas are obtained from instances of `__json__/1` (which can be echoed in the output).

The term of each `__json__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Fabric.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each canvas.

Check https://fabricjs.com/demos/ for possible values and for taking inspiration!

§§§§

The JSON object must contain an array of `objects`, and may include a few other properties:
- `dimensions`, to provide `width` and `height` of the canvas;
- `height`, to provide the height of the ingredient;
- `style`, to specify CSS properties for the canvas element (e.g., `border: 1px dashed green` to add a border);
- `debug` with value `true`, to log the canvas object in the console. 

Regarding the `objects`, we refer the old documentation of Fabric.js:
https://fabricjs.com/docs/old-docs/fabric-intro-part-1/

The `type` of the object is the name of the class.
Almost all object types can specify `left` and `top` values.
Many object types support the `width` and `height` values, as well as the `angle` value (to rotate the object).
Other properties are specific of some object types, as for example the `radius` value for `circle`.
Colors can be specified in `fill` and `stroke` properties;
`strokeWidth` can be specified as well.

`Text` is a solo object, but it can be combined with other objects in a `group` to obtain text inside/above shapes.

An easy way to go is to start with a small example, activate debugging, and having a look at the available properties for the included objects.

As a concrete example, let's consider an instance and associated solution of the **Skyscrapers** puzzle (https://www.puzzle-skyscrapers.com/):
```asp
size(4).

see(right,1,2).
see(left,3,4).
see(left,4,1).
see(top,2,1).
see(bottom,4,3).

assign(cell(1,1),3).
assign(cell(2,1),4).
assign(cell(3,1),1).
assign(cell(4,1),2).
assign(cell(1,2),2).
assign(cell(2,2),1).
assign(cell(3,2),4).
assign(cell(4,2),3).
assign(cell(1,3),1).
assign(cell(2,3),2).
assign(cell(3,3),3).
assign(cell(4,3),4).
assign(cell(1,4),4).
assign(cell(2,4),3).
assign(cell(3,4),2).
assign(cell(4,4),1).
```

Let's add an **Encode** ingredient with the following content for the `__json__` predicate:
```javascript
{
  objects: [
    {{= {{f"
    {
      type: group,
      left: ${15 + X * 45},
      top: ${15 + Y * 45},
      width: 30,
      height: 30,
      selectable: false,
      objects: [
        {
          type: rect,
          width: 30,
          height: 30,
          fill: {
            type: 'linear',
            gradientUnits: 'pixels',
            coords: { x1: 0, y1: 30, x2: 30, y2: 00 },
            colorStops: [
              { offset: 0, color: 'red' },
              { offset: 0.5, color: 'green' },
              { offset: 1, color: 'blue' }
            ]
          },
          originX: center,
          originY: center,
        }, {
          type: text,
          text: "${N}",
          fill: white,
          fontFamily: "Arial",
          fontSize: 20,
          fontWeight: bold,
          originX: center,
          originY: center,
        }
      ]
    }
    "}} : assign(cell(X,Y),N) }}

    {{= {{f"
    {
      type: group,
      left: ${15 + X * 45},
      top: 0,
      width: 30,
      height: 30,
      selectable: false,
      objects: [
        {
          type: triangle,
          width: 30,
          height: 20,
          top: 20,
          angle: 180,
          fill: gray,
          originX: center,
          originY: center,
        }, {
          type: rect,
          width: 30,
          height: 20,
          fill: gray,
          align: right,
          originX: center,
          originY: center,
        }, {
          type: text,
          text: "${N}",
          top: 5,
          fontFamily: "Arial",
          fontSize: 15,
          fontWeight: bold,
          originX: center,
          originY: center,
        }
      ]
    }
    "}} : see(top,X,N) }}

    {{= {{f"
    {
      type: group,
      left: ${15 + X * 45},
      top: ${15 + (S+1) * 45},
      width: 30,
      height: 30,
      selectable: false,
      objects: [
        {
          type: triangle,
          width: 30,
          height: 20,
          fill: gray,
          originX: center,
          originY: center,
        }, {
          type: rect,
          width: 30,
          height: 20,
          top: 20,
          fill: gray,
          align: right,
          originX: center,
          originY: center,
        }, {
          type: text,
          text: "${N}",
          top: 15,
          fontFamily: "Arial",
          fontSize: 15,
          fontWeight: bold,
          originX: center,
          originY: center,
        }
      ]
    }
    "}} : see(bottom,X,N), size(S) }}
  
    {{= {{f"
    {
      type: group,
      top: ${15 + X * 45},
      left: 0,
      width: 30,
      height: 30,
      selectable: false,
      objects: [
        {
          type: triangle,
          width: 30,
          height: 20,
          left: 20,
          angle: 90,
          fill: gray,
          originX: center,
          originY: center,
        }, {
          type: rect,
          width: 20,
          height: 30,
          top: 0,
          fill: gray,
          align: right,
          originX: center,
          originY: center,
        }, {
          type: text,
          text: "${N}",
          left: 5,
          fontFamily: "Arial",
          fontSize: 15,
          fontWeight: bold,
          originX: center,
          originY: center,
        }
      ]
    }
    "}} : see(left,X,N) }}

    {{= {{f"
    {
      type: group,
      top: ${15 + X * 45},
      left: ${15 + (S+1) * 45},
      width: 30,
      height: 30,
      selectable: false,
      objects: [
        {
          type: triangle,
          width: 30,
          height: 20,
          angle: 270,
          fill: gray,
          align: right,
          originX: center,
          originY: center,
        }, {
          type: rect,
          width: 20,
          height: 30,
          left: 20,
          fill: gray,
          align: right,
          originX: center,
          originY: center,
        }, {
          type: text,
          text: "${N}",
          left: 15,
          fontFamily: "Arial",
          fontSize: 15,
          fontWeight: bold,
          originX: center,
          originY: center,
        }
      ]
    }
    "}} : see(right,X,N), size(S) }}
  ],
  dimensions: {
    height: 350,
    width: 500,
  }
  height: 400,
  style: 'border: 1px dashed green;',
}
```

After that, add the **Fabric.js** operation to obtain a nice visualization.