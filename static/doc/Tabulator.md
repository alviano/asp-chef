The **Tabulator** operation shows input models in tables powered by the Tabulator framework.

Tables are obtained from instances of `__tab__/1` (which can be echoed in the output).

The term of each `__tab__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the ApexCharts object.

The input is echoed in output.
It's possible to show/hide the index of the model above each table.

Check https://tabulator.info/ for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the ApexCharts website.
For example, let's consider the *quickstart* example:
https://tabulator.info/docs/6.3/quickstart

We have to adapt the object passed to the constructor of `Tabulator`.
Let me report it below:
```javascript
{
  height:205,
  data:[
    {id:1, name:"Oli Bob", age:"12", col:"red", dob:""},
    {id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982"},
    {id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982"},
    {id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980"},
    {id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"},
  ],
  layout:"fitColumns",
  columns:[ 
    {title:"Name", field:"name", width:150},
    {title:"Age", field:"age", hozAlign:"left", formatter:"progress"},
    {title:"Favourite Color", field:"col"},
    {title:"Date Of Birth", field:"dob", sorter:"date", hozAlign:"center"},
  ],
}
```

If we provide the above content in an **Encode** ingredient with predicate `__tab__`, and after that we add a **Tabulator** ingredient, we obtain an *interactive table*.
However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% data: ID, NAME, AGE, COLOR, DATE-OF-BIRTH
data(1, "Oli Bob", 12, "red", "").
data(2, "Mary May", 1, "blue", "14/05/1982").
data(3, "Christine Lobowski", 42, "green", "22/05/1982").
data(4, "Brendon Philips", 125, "orange", "01/08/1980").
data(5, "Margret Marmajuke", 16, "yellow", "31/01/1999").
```

Modify the **Encode** ingredient as follows: 
```javascript
{{+ separator(", ") }}

{
  height:205,
  data:[
    {{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
  ],
  layout:"fitColumns",
  columns:[ 
    {title: "Name", field: "name", width: 150},
    {title: "Age", field: "age", hozAlign: "left", formatter: "progress"},
    {title: "Favourite Color", field: "col"},
    {title: "Date Of Birth", field: "dob", sorter: "date", hozAlign: "center"},
  ],
}
```

Note that we are using **mustache queries** to take data from the input model.

Within the configuration object, it is possible to specify a `download` list of objects of the form
```javascript
{
    color: "success|secondary|...    default: secondary",
    label: "something to show in the button;  default to data.format",
    format: "csv|json|xlsx|pdf|html",
    filename: "default to data.format",
    options: "an objsect providing options (e.g., the delimiter in CSV) for the selected format"
}
```
ASP Chef will show buttons above the table, according to the provided configuration.
When the user will click the button, the browser will trigger the download action of the Tabulator.
For example, to add download buttons for CSV and Excel format, modify the encoded content as follows:
```javascript
{{+ separator(", ") }}

{
  height:205,
  data:[
    {{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
  ],
  layout:"fitColumns",
  columns:[ 
    {title: "Name", field: "name", width: 150},
    {title: "Age", field: "age", hozAlign: "left", formatter: "progress"},
    {title: "Favourite Color", field: "col"},
    {title: "Date Of Birth", field: "dob", sorter: "date", hozAlign: "center"},
  ],
  download: [
    {
      color: "success",
      format: "csv",
      options: {
        delimiter: "\t",
      }
    },
    {
      color: "success",
      format: "xlsx",
    },
  ]
}
```