The **ApexCharts** operation shows input models in charts powered by the ApexCharts framework.

Charts are obtained from instances of `__chart__/1` (which can be echoed in the output).

The term of each `__chart__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the ApexCharts object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://apexcharts.com/javascript-chart-demos/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the ApexCharts website.
For example, let's consider an *area chart* (with spline interpolation):
https://apexcharts.com/javascript-chart-demos/area-charts/spline/

We have to adapt the `options` object.
Let me report it below:
```javascript
{
  series: [
    {
      name: 'series1',
      data: [31, 40, 28, 51, 42, 109, 100]
    }, {
      name: 'series2',
      data: [11, 32, 45, 32, 34, 52, 41]
    }
  ],
  chart: {
    height: 350,
    type: 'area'
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'datetime',
    categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
    },
  },
}
```

If we provide the above content in an **Encode** ingredient with predicate `__chart__`, and after that we add a **ApexCharts** ingredient, we obtain an *area chart*.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
my_data("2018-09-19T00:00:00.000Z",31,11).
my_data("2018-09-19T01:30:00.000Z",40,32).
my_data("2018-09-19T02:30:00.000Z",28,45).
my_data("2018-09-19T03:30:00.000Z",51,32).
my_data("2018-09-19T04:30:00.000Z",42,34).
my_data("2018-09-19T05:30:00.000Z",109,52).
my_data("2018-09-19T06:30:00.000Z",100,41).
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  series: [
    {
      name: 'series1',
      data: [{{= show(S1, Key) : my_data(Key,S1,S2) }}]
    }, {
      name: 'series2',
      data: [{{= show(S2, Key) : my_data(Key,S1,S2) }}]
    }
  ],
  chart: {
    height: 350,
    type: 'area'
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'datetime',
    categories: [{{= show(@string_format("'%s'", Key), Key) : my_data(Key,S1,S2) }}]
  },
  tooltip: {
    x: {
      format: 'dd/MM/yy HH:mm'
    },
  },
}
```

Note that we are using **mustache queries** to take data from the input model.
