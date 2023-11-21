<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Graph";
    const default_extra_options = {
        height: 500,
        node_radius: 20,
        predicate: '__graph__',
        echo: false,
        search: '',
        search_color: 'yellow',
        search_text_color: 'red',
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input, options);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(model => model.filter(atom => atom.predicate !== options.predicate));
    });

    function process_node(nodes, links, atom) {
        const key = atom.terms[0].terms[0].str;
        if (!nodes.has(key)) {
            nodes.set(key, {
                id: key,
                label: '',
            });
        }
        const node = nodes.get(key);
        for (let term_index = 1; term_index < atom.terms.length; term_index++) {
            const term = atom.terms[term_index];
            const property = term.functor;
            const terms = term.terms;
            if (property === 'label' && terms.length === 1) {
                node.label = `${terms[0].string || terms[0].number || terms[0].str}`;
            } else if (property === 'color' && terms.length === 1) {
                node.color = terms[0].string || terms[0].str;
            } else if (property === 'text_color' && terms.length === 1) {
                node.text_color = terms[0].string || terms[0].str;
            } else if (property === 'font' && terms.length === 1) {
                node.font = terms[0].string;
            } else if (property === 'radius' && terms.length === 1) {
                node.radius = terms[0].number;
            } else if (property === 'shape' && terms.length > 0) {
                node.shape = terms.length > 1 ? terms.map(term => term.number) : terms[0].string || terms[0].str;
            } else if (property === 'opacity' && terms.length === 1) {
                node.opacity = terms[0].number / 100;
            } else if (property === 'fx' && terms.length === 1) {
                node.fx = terms[0].number;
            } else if (property === 'fy' && terms.length === 1) {
                node.fy = terms[0].number;
            } else if (property === 'draggable' && terms.length === 0) {
                node.undraggable = false;
            } else if (property === 'undraggable' && terms.length === 0) {
                node.undraggable = true;
            } else {
                Utils.snackbar(`Unknown node property: ${property}/${terms.length}`);
            }
        }
    }

    function process_link(nodes, links, atom) {
        const key = `${atom.terms[0].terms[0].str},${atom.terms[0].terms[1].str}`;
        if (!links.has(key)) {
            links.set(key, {
                source: atom.terms[0].terms[0].str,
                target: atom.terms[0].terms[1].str,
                label: '',
            });
        }
        const link = links.get(key);
        for (let term_index = 1; term_index < atom.terms.length; term_index++) {
            const term = atom.terms[term_index];
            const property = term.functor;
            const terms = term.terms;
            if (property === 'label' && terms.length === 1) {
                link.label = `${terms[0].string || terms[0].number || terms[0].str}`;
            } else if (property === 'color' && terms.length === 1) {
                link.color = terms[0].string || terms[0].str;
            } else if (property === 'undirected' && terms.length === 0) {
                link.undirected = true;
            } else if (property === 'directed' && terms.length === 0) {
                link.undirected = false;
            } else if (property === 'text_color' && terms.length === 1) {
                link.text_color = terms[0].string || terms[0].str;
            } else if (property === 'opacity' && terms.length === 1) {
                link.opacity = terms[0].number / 100;
            } else {
                Utils.snackbar(`Unknown link property: ${property}/${terms.length}`);
            }
        }
    }

    function process_defaults(defaults, term) {
        const property = term.functor;
        const terms = term.terms;
        if (property === 'node_radius') {
            defaults.node_radius = terms[0].number;
        } else if (property === 'node_color' && terms.length === 1) {
            defaults.node_color = terms[0].string || terms[0].str;
        } else if (property === 'node_text_color' && terms.length === 1) {
            defaults.node_text_color = terms[0].string || terms[0].str;
        } else if (property === 'node_font' && terms.length === 1) {
            defaults.node_font = terms[0].string;
        } else if (property === 'node_opacity' && terms.length === 1) {
            defaults.node_opacity = terms[0].number / 100;
        } else if (property === 'node_shape' && terms.length > 0) {
            defaults.node_shape = terms.length > 1 ? terms.map(term => term.number) : terms[0].string || terms[0].str;
        } else if (property === 'node_draggable' && terms.length === 0) {
            defaults.node_undraggable = undefined;
        } else if (property === 'node_undraggable' && terms.length === 0) {
            defaults.node_undraggable = true;
        } else if (property === 'link_color' && terms.length === 1) {
            defaults.link_color = terms[0].string || terms[0].str;
        } else if (property === 'link_text_color' && terms.length === 1) {
            defaults.link_text_color = terms[0].string;
        } else if (property === 'link_opacity' && terms.length === 1) {
            defaults.link_opacity = terms[0].number / 100;
        } else if (property === 'undirected' && terms.length === 0) {
            defaults.undirected = true;
        } else if (property === 'directed' && terms.length === 0) {
            defaults.undirected = undefined;
        } else {
            Utils.snackbar(`Unknown default property: ${property}/${terms.length}`);
        }
    }

    function model2graph(model, options) {
        const nodes = new Map();
        const links = new Map();
        const defaults = {};
        model.forEach(atom => {
            if (atom.predicate === options.predicate) {
                if (atom.terms[0].functor === 'node' && atom.terms[0].terms.length === 1) {
                    process_node(nodes, links, atom);
                } else if (atom.terms[0].functor === 'link' && atom.terms[0].terms.length === 2) {
                    process_link(nodes, links, atom);
                } else if (atom.terms[0].functor === 'defaults' && atom.terms[0].terms.length === 0) {
                    for (let term_index = 1; term_index < atom.terms.length; term_index++) {
                        process_defaults(defaults, atom.terms[term_index])
                    }
                } else {
                    Utils.snackbar(`Unknown graph directive: ${atom.terms[0].functor}/${atom.terms[0].terms.length}`);
                }
            }
        });
        return {
            nodes: Array.from(nodes.values()),
            links: Array.from(links.values()),
            defaults,
        };
    }
</script>

<script>
    import {Badge, Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";
    import GraphCanvas from "$lib/operations/+GraphCanvas.svelte";
    import {Popover} from "dumbo-svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let copy_layout = false;

    let graphs = [];
    let number_of_models = 0;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, async (input, options) => {
            number_of_models = input.length;
            graphs.length = 0;
            await tick();
            if (input.length > 0) {
                graphs = [model2graph(input[0], options)];
            }
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation shows one model in input as a graph.
        </p>
        <p>
            The graph is encoded by predicate <code>__graph__</code>.
            The first term is one of <code>node(ID)</code>, <code>link(SOURCE,TARGET)</code>, <code>defaults</code>.
            The other terms have the form <code>property(VALUE)</code>.
        </p>
        <p>
            Node properties: label, color, draggable/undraggable, font, fx, fy, opacity, radius, shape, text_color.
        </p>
        <p>
            Link properties: directed/undirected, label, color, opacity, text_color.
        </p>
        <p>
            Default properties:
            node_color,
            node_draggable/node_undraggable,
            node_font,
            node_opacity,
            node_radius (also defining the capture area for dragging nodes),
            node_shape,
            node_text_color,
            link_color,
            link_text_color,
            link_opacity,
            directed/undirected.
        </p>
        <p>
            Labels can be searched in the graph.
            If <Badge><Icon name="clipboard-plus" /></Badge> is active, drag the graph with the mouse to copy the layout (position of nodes).
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number" min="50" step="50" bind:value={options.height} on:input={edit} style="max-width: 5em;" />
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="Graph-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!copy_layout}" on:click={() => { copy_layout = !copy_layout; }} title="Copy the position of nodes in the clipboard when the graph is dragged"><Icon name="clipboard-plus" /></Button>
    </InputGroup>
    {#if number_of_models !== 1}
        <InputGroup>
            <InputGroupText>
                Error: expecting 1 model in input, {number_of_models} models found!
            </InputGroupText>
        </InputGroup>
    {/if}
    <InputGroup>
        <InputGroupText>Highlight color</InputGroupText>
        <Input type="text" placeholder="Color..." bind:value={options.search_color} on:change={edit} />
        <InputGroupText>Highlight text color</InputGroupText>
        <Input type="text" placeholder="Text color..." bind:value={options.search_text_color} on:change={edit} />
    </InputGroup>
    <div slot="output">
        {#each graphs as graph}
            <GraphCanvas
                    {graph}
                    predicate="{options.predicate}"
                    {copy_layout}
                    max_height="{options.height}"
                    search_pattern={options.search}
                    search_color={options.search_color}
                    search_text_color={options.search_text_color}
            />
        {/each}
        <InputGroup>
            <InputGroupText>Search</InputGroupText>
            <Input type="search" placeholder="Search..." bind:value={options.search} on:change={edit} />
        </InputGroup>
    </div>
</Operation>
