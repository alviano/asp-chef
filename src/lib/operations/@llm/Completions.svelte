<script context="module">
    import {Recipe} from "$lib/recipe";
    import { Base64 } from "js-base64";
    import _ from 'lodash';
    

    const operation = "@llm/Completions";
    const default_extra_options = {
        input: '__base64__',
        config: '__config__',
        model: '',
        completions: '/chat/completions',
        output: '__llm__',
        system: 'You are a helpful assistant.'
    };

    const listeners = new Map();

    function process_match(query_answer) {
        if (query_answer.length === 0) {
            throw Error("Expected one model, 0 found");
        }

        let separator = '\n';
        let term_separator = ', ';
        let prefix = '';
        let suffix = '';

        const replacement = [];
        let output_atoms = [];
        Utils.parse_atoms(query_answer[0]).forEach(atom => {
            if (atom.functor === undefined && atom.predicate === undefined) {
                atom.functor = '';
                atom.terms = [atom];
            }
            if (atom.functor === '') {
                output_atoms.push(atom);
            }
        });
        output_atoms.forEach(atom => {
            const terms = atom.terms.map(term => term.string !== undefined ? term.string : term.str);
            if (atom.functor === '') {
                replacement.push(prefix + terms.join(term_separator) + suffix);
            }
        });
        return replacement.join(separator);
    }
    
    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        let res = []
        try {
            listeners.get(id)(input);            
            const config = input.map(part => part.filter(a => a.predicate === options.config).map(c => Base64.decode(c.terms[0].string)));
            if (config.length != 0) {
                const server = JSON.parse(config[0][0])
                const the_output = [];
                for (let model of input) {
                    const output_part = [];
                    for (let atom of model.filter(atom => atom.predicate === options.input)) {
                        let model_query = Base64.decode(atom.terms[0].string);
                        const matches = model_query.matchAll(/\{\{(=?)(((?!}}).)*)}}/gs);
                        if (matches !== null) {
                            for (let the_match of matches) {
                                const inline = the_match[1].trim();
                                const match = the_match[2].trim();
                                const program = model.map(atom => `${atom.str}.`).join('\n') + '\n#show.\n' +
                                    (inline ? '#show ' : '') + match + (match.endsWith('.') ? '' : '.');
                                const query_answer = await Utils.search_models(program, 1, true);
                                model_query = model_query.replace(the_match[0], process_match(query_answer));
                            }
                        }
                        output_part.push(model_query);
                    }
                    the_output.push(output_part.join('\n'));
                }
                const query = the_output.join('\n\n');               
                if (options.completions != '' && options.model != '') {
                    const response = await call_server(server, options.completions, options.model, options.system, query)
                    if (!response.error) {
                        const text = response.choices[0].message.content
                        const content = Base64.encode(text)
                        const encoded_content = Utils.parse_atom(`${options.output}("${content}")`);
                        input.forEach(part => {
                            res.push([...part, encoded_content])
                        });
                    }
                }
            } 

        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return res;
    });

	async function call_server(server, relative_url, model, system, text) {
        const response = await fetch(`${server.url}${relative_url}`, {
            method: "POST",
            mode: "cors",
            cache: Utils.browser_cache_policy,
            credentials: "same-origin",
            headers: new Headers([["Content-Type", "application/json"], ["Authorization", `Bearer ${server.key}`]]),
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: system
                    },
                    {
                        role: "user",
                        content: text
                    }
                ]
            }),
        });
        const json = await response.json();
        return json;
    }
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
    import {onDestroy, onMount} from "svelte";
    import Operation from "$lib/Operation.svelte";
    import {Utils} from "$lib/utils";

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
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Input</InputGroupText>
        <Input type="text"
               bind:value="{options.input}"
               placeholder="input"
               on:input={edit}
               data-testid="Llm-input"
        />
        <InputGroupText>Output</InputGroupText>
        <Input type="text"
               bind:value={options.output}
               placeholder="output"
               on:input={edit}
               data-testid="Llm-output"
        />
        <InputGroupText>Config</InputGroupText>
        <Input type="text"
               bind:value="{options.config}"
               placeholder="configuration"
               on:input={edit}
               data-testid="Llm-config"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Url</InputGroupText>
        <Input type="text"
            bind:value="{options.completions}"
            placeholder="/chat/completions"
            on:input={edit}
        />
        <InputGroupText style="width: 7em;">Model</InputGroupText>
        <Input type="text"
            bind:value="{options.model}"
            placeholder="model"
            on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">System</InputGroupText>
        <Input type="text"
            bind:value="{options.system}"
            placeholder="Initial setup for llm"
            on:input={edit}
        />
    </InputGroup>
</Operation>