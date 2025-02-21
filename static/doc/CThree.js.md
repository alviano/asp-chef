The **C Three.js** operation shows input models in charts powered by the C3.js framework.

Charts are obtained from instances of `__chart__/1` (which can be echoed in the output).

The term of each `__chart__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the C3.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://c3js.org/examples.html for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the C3.js website.
For example, let's consider a *combination chart*:
https://c3js.org/samples/chart_combination.html

We have to adapt the object passed to the `c3.generate` function.
Let me report it below:
```javascript
{
    data: {
        columns: [
            ['data1', 30, 20, 50, 40, 60, 50],
            ['data2', 200, 130, 90, 240, 130, 220],
            ['data3', 300, 200, 160, 400, 250, 250],
            ['data4', 200, 130, 90, 240, 130, 220],
            ['data5', 130, 120, 150, 140, 160, 150],
            ['data6', 90, 70, 20, 50, 60, 120],
        ],
        type: 'bar',
        types: {
            data3: 'spline',
            data4: 'line',
            data6: 'area',
        },
        groups: [
            ['data1','data2']
        ]
    }
}
```

If we provide the above content in an **Encode** ingredient with predicate `__chart__`, and after that we add a **C Three.js** ingredient, we obtain a *combination chart*.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% data: ID, INDEX, VALUE
data(1,0,30).
data(1,1,20).
data(1,2,50).
data(1,3,40).
data(1,4,60).
data(1,5,50).
data(2,0,200).
data(2,1,130).
data(2,2,90).
data(2,3,240).
data(2,4,130).
data(2,5,220).
data(3,0,300).
data(3,1,200).
data(3,2,160).
data(3,3,400).
data(3,4,250).
data(3,5,250).
data(4,0,200).
data(4,1,130).
data(4,2,90).
data(4,3,240).
data(4,4,130).
data(4,5,220).
data(5,0,130).
data(5,1,120).
data(5,2,150).
data(5,3,140).
data(5,4,160).
data(5,5,150).
data(6,0,90).
data(6,1,70).
data(6,2,20).
data(6,3,50).
data(6,4,60).
data(6,5,120).
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}
{{+ sort(2) }}

{
    data: {
        columns: [
            ['data1', {{= show(Value,Index) : data(1,Index,Value)}}],
            ['data2', {{= show(Value,Index) : data(2,Index,Value)}}],
            ['data3', {{= show(Value,Index) : data(3,Index,Value)}}],
            ['data4', {{= show(Value,Index) : data(4,Index,Value)}}],
            ['data5', {{= show(Value,Index) : data(5,Index,Value)}}],
            ['data6', {{= show(Value,Index) : data(6,Index,Value)}}],
        ],
        type: 'bar',
        types: {
            data3: 'spline',
            data4: 'line',
            data6: 'area',
        },
        groups: [
            ['data1','data2']
        ]
    }
}
```

Note that we are using **mustache queries** to take data from the input model.
In particular, note that we are using the `show` function to ensure that duplicated `Value`s are included in the expansion, and to sort them by `Index`.
