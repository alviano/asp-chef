The **ChartJS** operation shows input models in charts powered by the Chart.js framework.

Charts are obtained from instances of `__chart__/1` (which can be echoed in the output).

The term of each `__chart__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the Chart.js object.

The input is echoed in output.
It's possible to show/hide the index of the model above each table.

Check https://www.chartjs.org/docs/latest/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the Chart.js website.
For example, let's consider a *bar chart*:
https://www.chartjs.org/docs/latest/charts/bar.html

We have to adapt the `config` object.
Let me simplify it as follows:
```javascript
{
  type: 'bar',
  data: {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [{
      label: 'My First Dataset',
      data: [65, 56, 80, 81, 56, 55, 40],
      borderWidth: 1,
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  },
}
```

If we provide the above content in an **Encode** ingredient with predicate `__chart__`, and after that we add a **ChartJS** ingredient, we obtain a *bar chart*.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
my_first_dataset("January",65).
my_first_dataset("February",56).
my_first_dataset("March",80).
my_first_dataset("April",81).
my_first_dataset("May",56).
my_first_dataset("June",55).
my_first_dataset("July",40).
```

Modify the **Encode** ingredient as follows: 
```javascript
{
  type: 'bar',
  data: {
    labels: [{{= Key : my_first_dataset(Key, Value) }}],
    datasets: [{
      label: 'My First Dataset',
      data: [{{= show(Value, Key) : my_first_dataset(Key, Value) }}],
      borderWidth: 1,
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  },
}
```

Note that we are using **mustache queries** to take data from the input model.
In particular, note that the second of such queries
```asp
{{= show(Value, Key) : my_first_dataset(Key, Value) }}
```
is using the `show` function to ensure that duplicated `Value`s are included in the expansion.


For another example, let's consider a *scatter plot*:
https://www.chartjs.org/docs/latest/charts/scatter.html

Here is a static plot:
```javascript
{
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Scatter Dataset',
      data: [{
        x: -10,
        y: 0
      }, {
        x: 0,
        y: 10
      }, {
        x: 10,
        y: 5
      }, {
        x: 0.5,
        y: 5.5
      }],
      backgroundColor: 'rgb(255, 99, 132)'
    }],
  },
  options: {
    scales: {
      x: {
        type: 'linear',
        position: 'bottom'
      }
    }
  }
}
```

Let's move the points in the input:
```asp
point(-10,0).
point(0,10).
point(10,5).
point(real("0.5"),real("5.5")).
```
Note that we are using the `real` representation of non-integral numbers common in ASP Chef.
We can now use a **mustache query** to expand points: 
```asp
{
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Scatter Dataset',
      data: [{{= @string_format("{x: %s, y: %s},", X, Y) : point(X,Y) }}],
      backgroundColor: 'rgb(255, 99, 132)'
    }],
  },
  options: {
    scales: {
      x: {
        type: 'linear',
        position: 'bottom'
      }
    }
  }
}
```