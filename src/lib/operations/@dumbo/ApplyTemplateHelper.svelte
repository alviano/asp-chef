<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Apply Template Helper";
    const default_extra_options = {
        template_name: '',
        predicate_mapping: [],
        output_ptedicate: '__program__',
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        if (!options.template_name || !options.output_predicate) {
            return input;
        }

        return input.map(part => [...part, Utils.parse_atom(`${options.output_predicate}("${Base64.encode(pack_apply_template(options.template_name, options.predicate_mapping))}")`)])
    });

    function pack_apply_template(template, predicate_mapping) {
        const mapping = predicate_mapping.filter(value => value[1]).map(value => {
            const [predicate, arity] = value[0].split('/');
            return `,\n    (${predicate}(${arity}), ${value[1]})`;
        })
        if (mapping.length > 0) {
            return `__apply_template__("${template}"${mapping.join("")}\n).`;
        }
        else {
            return `__apply_template__("${template}").`;
        }
    }

</script>

<script>
    import {
        Button,
        Icon,
        Input,
        InputGroup,
        InputGroupText
    } from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo.js";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let templates = [];
    let doc = '';
    let predicate_mapping = [];

    function change_predicate_mapping(index, value) {
        predicate_mapping[index][1] = value;
        edit();
    }

    function edit() {
        options.predicate_mapping = [...predicate_mapping];
        Recipe.edit_operation(id, index, options);
    }

    async function add_predicates_of_template(template) {
        if (template) {
            const predicates = Dumbo.core_template_predicates(template);
            predicates.forEach(predicate => {
                if (!predicate_mapping.some(value => value[0] === predicate)) {
                    predicate_mapping.push([predicate, '']);
                }
            });
        }
        predicate_mapping = predicate_mapping;
        edit();
    }

    async function remove_predicates_not_in_template(template) {
        if (template) {
            const predicates = new Set(Dumbo.core_template_predicates(template));
            predicate_mapping = predicate_mapping.filter(value => predicates.has(value[0]));
        }
        edit();
    }

    onMount(async () => {
        if (id !== undefined) {
            templates = await Dumbo.fetch_core_templates();
        }

        if (options) {
            predicate_mapping = options.predicate_mapping;
        }
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} operation={operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        {@html Utils.render_markdown(doc)}
    </div>
    <InputGroup>
        <InputGroupText>Output Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:input={edit} data-testid="ApplyTemplate-output_predicate" />
    </InputGroup>
    <InputGroup>
        <Input type="search"
               id="doc-search"
               bind:value={options.filter}
               placeholder="Filter templates..."
               autocomplete="off"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup class="overflow-auto pt-1" style="max-height: 10em">
        {#each templates.filter(template => template.match(new RegExp(options.filter, 'i'))) as template}
             <InputGroup class="ps-2">
                 <Input type="radio" bind:group={options.template_name} value={template} label="{template}" on:change={() => add_predicates_of_template(options.template_name)} />
             </InputGroup>
        {/each}
    </InputGroup>
    <InputGroup>
        <Input type="text" value="Predicate mapping" disabled={true} />
        <Button on:click={(event) => { event.preventDefault(); remove_predicates_not_in_template(options.template_name); }}>
            <Icon name="trash" class="me-2" />
            Remove predicates not in the template
        </Button>
    </InputGroup>
    <InputGroup>
        {#each predicate_mapping as [predicate, new_name], index}
            <InputGroup>
                <Input value="{predicate}" disabled="{true}" />
                <Input type="text"
                       value={new_name}
                       placeholder="A new predicate name"
                       on:input={(event) => change_predicate_mapping(index, event.target.value)}
                       data-testid="new_name"
                       invalid="{new_name && !Utils.is_valid_predicate(new_name)}"
                />
            </InputGroup>
        {/each}
    </InputGroup>
    <div slot="output">
        {#if options.template_name}
            <div style="margin: 0.5em">
                <h2>{options.template_name}</h2>
                {@html Utils.render_markdown(Dumbo.core_template_documentation(options.template_name))}
                <hr />
                <pre class="position-relative p-2"><div class="position-absolute top-0 end-0" style="z-index: 1;"><button class="btn btn-secondary btn-sm" on:click={() => navigator.clipboard.writeText(pack_apply_template(options.template_name))} aria-label="copy"><i class="bi-clipboard-plus"></i></button></div><code>{pack_apply_template(options.template_name, options.predicate_mapping)}</code></pre>
            </div>
        {/if}
    </div>
</Operation>
