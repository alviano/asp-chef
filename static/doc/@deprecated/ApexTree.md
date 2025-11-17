__This operation is available only on local installations!__

The **ApexTree** operation shows input models in trees powered by the ApexTree framework.

Trees are obtained from instances of `__tree__/1` (which can be echoed in the output).

The term of each `__tree__/1` instance is a Base64-encoded string, possibly including mustache queries (very likely using the `tree` atom).
It will be interpreted as a (relaxed) JSON object, and used to configure the ApexCharts object.

The input is echoed in output.
It's possible to show/hide the index of the model above each chart.

Check https://apexcharts.com/apextree/demos/ for possible values and for taking inspiration!

§§§§

---

__How to use this operation in a local installations__

Check that the licence of ApexTree (https://apexcharts.com/pricing/) is compatible with your usage.

Run `npm add apextree`.

Replace the content of `src/lib/operations/@deprecated/ApexTree` with the following code:
```javascript
<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "ApexTree";
    const default_extra_options = {
        predicate: "__tree__",
        multistage: false,
        echo: false,
        show_model_index: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import ApexTree from "./+ApexTree.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="ApexTree-predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.show_model_index}" on:click={() => { options.show_model_index = !options.show_model_index; edit(); }}>Model Index</Button>
    </InputGroup>
    <div slot="output">
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if options.show_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                {#key model}
                    {#each model.filter(atom => atom.predicate === options.predicate) as configuration}
                        <ApexTree part="{model}" index="{index}" configuration_atom="{configuration}" multistage="{options.multistage}" />
                    {/each}
                {/key}
            {/each}
        </div>
    </div>
</Operation>
```

Add the file `src/lib/operations/@deprecated/+ApexTree` with the following content:
```javascript
<script>
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import ApexTree from "apextree";

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;

    let chart;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. ApexTree`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. ApexTree`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            new ApexTree(chart, configuration.options || {}).render(configuration.data || {});
        } catch (err) {
            Utils.snackbar(`#${index + 1}. ApexTree: ${err}`);
        }
    });
</script>

<div class="chart" bind:this={chart}>
</div>

<style>
    div.chart {
        margin: 5px;
    }
</style>
```

You are ready to go!

---



An easy way to go is to start with an example from the ApexTree website.
For example, let's consider an the *Dynamic view change* example:
https://apexcharts.com/apextree/demos/dynamic-view-change/

We have to adapt the `data` and `options` objects, and include them in a single object.
Let me report it below:
```javascript
{
  data: {
    id: 'Species',
    name: 'Species',
    children: [
      {
        id: '2',
        name: 'Plants',
        children: [
          {
            id: '3',
            name: 'Mosses',
          },
          {
            id: '4',
            name: 'Ferns',
          },
        ],
      },
      {
        id: '8',
        name: 'Fungi',
      },
      {
        id: '9',
        name: 'Lichens',
      },
      {
        id: '10',
        name: 'Animals',
        children: [
          {
            id: '11',
            name: 'Invertebrates',
            children: [
              {
                id: '12',
                name: 'Insects',
              },
            ],
          },
          {
            id: '16',
            name: 'Vertebrates',
            children: [
              {
                id: '17',
                name: 'Fish',
              },
              {
                id: '19',
                name: 'Reptiles',
              },
            ],
          },
        ],
      },
    ],
  },
  options: {
    contentKey: 'name',
    width: 800,
    height: 700,
    nodeWidth: 150,
    nodeHeight: 50,
    childrenSpacing: 150,
    siblingSpacing: 30,
    direction: 'top',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontColor: '#a06dcc',
    borderWidth: 2,
    borderColor: '#a06dcc',
    canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
  }
}
```
Note that the tree is represented by a Javascript object, reflecting the recursive structure of the tree.
If we provide the above content in an **Encode** ingredient with predicate `__tree__`, and after that we add a **ApexTree** ingredient, we obtain a nice visualization.

However, it can be more interesting to take data from the input model.
The main difficulty is to adapt the relational format of ASP facts to the recursive representation used by **ApexTree**.
We can take advantage of the `tree` predicate of **mustache queries**.
Let's say we have the following input:
```asp
                    node(root, "Species").
  tree(root, 2).    node(2, "Plants").
    tree(2, 3).     node(3, "Mosses").
    tree(2, 4).     node(4, "Ferns").
  tree(root, 8).    node(8, "Fungi").
  tree(root, 9).    node(9, "Lichens").
  tree(root, 10).   node(10, "Animals").
    tree(10, 11).   node(11, "Invertebrates").
      tree(11, 12). node(12, "Insects").
    tree(10, 16).   node(16, "Vertebrates").
      tree(16, 17). node(17, "Fish").
      tree(16, 19). node(19, "Reptiles").
```

Modify the **Encode** ingredient as follows: 
```javascript
{
  data: {{
    #show tree(my_tree, root(Node)) : tree(Node,_), not tree(_,Node).
    #show tree(my_tree, node(Node, @string_format("{id: '%s', name: '%s', children: [{CHILDREN}] }", Node, Name))) : node(Node,Name).
    #show tree(my_tree, link(A,B)) : tree(A,B).
  }},
  options: {
    contentKey: 'name',
    width: 800,
    height: 700,
    nodeWidth: 150,
    nodeHeight: 50,
    childrenSpacing: 150,
    siblingSpacing: 30,
    direction: 'top',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontColor: '#a06dcc',
    borderWidth: 2,
    borderColor: '#a06dcc',
    canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
  }
}
```

Note that we are using the `tree` predicate in the **mustache query** to take data from the input model and shape them as a tree.