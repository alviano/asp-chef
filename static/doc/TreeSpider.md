The **TreeSpider** operation shows input models in trees powered by the TreeSpider framework.

Trees are obtained from instances of `__tree__/1` (which can be echoed in the output).

The term of each `__tree__/1` instance is a Base64-encoded string, possibly including mustache queries.
It will be interpreted as a (relaxed) JSON object, and used to configure the TreeSpider object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://paulosabayomi.github.io/treespider-doc/docs/basic-usage for possible values and for taking inspiration!

§§§§

An easy way to go is to start with an example from the TreeSpider website.

We have to provide a configuration object with `tree_data` and possibly other options:
```javascript
{
  tree_data:  [
    {
        id: "1",
        name: "Abayomi Amusa",
        role: "CEO",
        location: "Lagos, Nigeria"
    },
    {
        id: "2",
        parentId: "1",
        name: "Trey Anderson",
        role: "Product Manager",
        location: "California, United States"
    },
    {
        id: "3",
        parentId: "1",
        name: "Troy Manuel",
        role: "Software Developer",
        location: "Alberta, Canada"
    },
  ],
  tree_type: "cellar",
  chart_head_type: "landscape",
  backgroundPattern: "blurry",
  width: "100%",
}
```
If we provide the above content in an **Encode** ingredient with predicate `__tree__`, and after that we add a **TreeSpider** ingredient, we obtain a nice visualization.

However, it can be more interesting to take data from the input model.
Let's say we have the following input:
```asp
% node(ID, NAME, ROLE, LOCATION)
node(1, null, "Abayomi Amusa", "CEO", "Lagos, Nigeria").
node(2, 1, "Trey Anderson", "Product Manager", "California, United States").
node(3, 1, "Troy Manuel", "Software Developer", "Alberta, Canada").
```

Modify the **Encode** ingredient as follows: 
```javascript
{
  tree_data: [
    {{= {{f"{
      id: ${ID},
      parentId: ${PARENT_ID},
      name: "${NAME}",
      role: "${ROLE}",
      location: "${LOCATION}",
    }"}} : node(ID, PARENT_ID, NAME, ROLE, LOCATION) }}
  ],
  tree_type: "cellar",
  chart_head_type: "landscape",
  backgroundPattern: "blurry",
  width: "100%",
  color_range: ['orange', 'purple']
}
```

Note that we are using the `null` value for the parent of the root node.