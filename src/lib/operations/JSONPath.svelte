<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import jsonpath from "jsonpath";
    import {Base64} from "js-base64";

    const operation = "JSON Path";
    const default_extra_options = {
        decode_predicate: '__base64__',
        echo_encoded_content: false,
        query: '',
        output_predicate: '__json__'
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const object_mapper = object => {
            if (typeof object === 'string') {
                return `"${object.replaceAll('"', '\\"')}"`;
            } else if (typeof object === 'number') {
                return object;
            } else if (Array.isArray(object)) {
                return object.map(object_mapper).join(',')
            } else if (typeof object === 'object') {
                return Object.keys(object).map(key => `${key}(${object_mapper(object[key])})`).join(',');
            }
            return object
        };
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        const data = JSON.parse(Base64.decode(atom.terms[0].string));
                        const answer = jsonpath.query(data, options.query);
                        return answer.map(object_mapper).map(term => `${options.output_predicate}(${term}).`).join('\n') +
                            (options.echo_encoded_content ? '\n' + mapper(atom) : '');
                    }
                    return mapper(atom);
                }).join('\n');
                const models = await Utils.search_models(program, options.number, options.raises);
                models.forEach(model => {
                    res.push(Utils.parse_atoms(model));
                });
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation applies JSON Path queries to Base64 encoded JSON documents
            (use an Encode operation).
        </p>
        <p>
            Each object in the answer is mapped to a fact.
            Strings are quoted.
            Arrays are expanded to arguments.
            Objects are mapped to functions (keys are expected to be valid terms).
            An example is reported below.
        </p>
        <code class="d-block ms-3">{'{'}</code>
        <code class="d-block ms-3">&nbsp;&nbsp;"nodes": [1, 2, 3],</code>
        <code class="d-block ms-3">&nbsp;&nbsp;"links": [</code>
        <code class="d-block ms-3">&nbsp;&nbsp;&nbsp;&nbsp;[1, 2],</code>
        <code class="d-block ms-3">&nbsp;&nbsp;&nbsp;&nbsp;[2, 3],</code>
        <code class="d-block ms-3">&nbsp;&nbsp;&nbsp;&nbsp;[3, 1]</code>
        <code class="d-block ms-3">&nbsp;&nbsp;]</code>
        <code class="d-block ms-3">{'}'}</code>
        <p>
            Two JSON Path queries, <code>$.nodes.*</code> and <code>$.links.*</code> can produce
        </p>
        <code class="d-block ms-3">node(1). node(2). node(3).</code>
        <code class="d-block ms-3">link(1,2).</code>
        <code class="d-block ms-3">link(2,3).</code>
        <code class="d-block ms-3">link(3,1).</code>
    </div>
    <InputGroup>
        <InputGroupText>Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
    </InputGroup>
    <Input type="text"
           bind:value={options.query}
           placeholder="$.phoneNumbers[:1].type"
           on:input={edit}
           data-testid="JSONPath-query"
    />
    <InputGroup>
        <InputGroupText>Output predicate</InputGroupText>
        <Input type="text"
               bind:value={options.output_predicate}
               placeholder="predicate"
               on:input={edit}
               data-testid="JSONPath-output-predicate"
        />
    </InputGroup>
</Operation>
