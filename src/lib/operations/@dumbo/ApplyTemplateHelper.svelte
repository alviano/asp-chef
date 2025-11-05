<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Apply Template Helper";
    const default_extra_options = {
        template_name: '',
        predicate_mapping: [],
        output_predicate: '__program__',
		custom_template_input_predicate: "",
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
		try {
			await listeners.get(id)(input, options);
		} catch (error) { /* component not mounted, possibly because of headless mode */ }

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
	let localCustomTemplates = new Map();

    function change_predicate_mapping(index, value) {
        predicate_mapping[index][1] = value;
        edit();
    }

    function edit() {
        options.predicate_mapping = [...predicate_mapping];
        Recipe.edit_operation(id, index, options);
    }

    async function add_predicates_of_template(template) {
		let predicates = [];

		if (Dumbo.is_core_template(template)) {
			predicates = Dumbo.core_template_predicates(template);
		} else if (localCustomTemplates.has(template)) {
			predicates = localCustomTemplates.get(template).predicates;
		} else {
			Recipe.set_errors_at_index(index,"Predicate mapping not found");
		}
		const newMappings = predicates
				.filter(p => !predicate_mapping.some(([existing]) => existing === p))
				.map(p => [p, '']);

		predicate_mapping = [...predicate_mapping, ...newMappings];
        edit();
    }

    async function remove_predicates_not_in_template(template) {
		let predicates = [];

		if (Dumbo.is_core_template(template)) {
			predicates = Dumbo.core_template_predicates(template);
		} else if (localCustomTemplates.has(template)) {
			predicates = localCustomTemplates.get(template).predicates;
		} else {
			Recipe.set_errors_at_index(index,"Predicate mapping not found");
		}
		predicate_mapping = predicate_mapping.filter(([pred]) => predicates.includes(pred));
		predicate_mapping = [...predicate_mapping];
        edit();
    }

    onMount(async () => {
        if (id !== undefined) {
            templates = await Dumbo.fetch_core_templates();
        }

        if (options) {
            predicate_mapping = options.predicate_mapping;
        }

		listeners.set(id, async (input, options) => {
			let program = "";
			for (const part of input) {
				part.forEach(atom => {
					if (atom.predicate === options.custom_template_input_predicate) {
						program += Base64.decode(atom.terms[0].str);
					}
				});
			}
			try {
				localCustomTemplates = new Map();
				if (program !== "") {
					const response = await Dumbo.fetch('template/parse-custom-template/', { program });

					for (const [name, template] of Object.entries(response)) {
						const predicates = template.predicates.map(pred => `\`${pred}\``).join(', ');
						template.documentation = `__Predicates:__ ${predicates}\n\n` + template.documentation.replaceAll('\n', '\n\n').replaceAll('\\n', '\n');
						localCustomTemplates.set(name, template);
					}
					localCustomTemplates = new Map(localCustomTemplates);
				}
			}
			catch (error) {
				Recipe.set_errors_at_index(index,error);
			}
		});
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
		<InputGroupText style="width: 10em;">Templates Library</InputGroupText>
		<Input type="text"
			   bind:value="{options.custom_template_input_predicate}"
			   placeholder="predicate"
			   on:input={edit}
		/>
	</InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Output Predicate</InputGroupText>
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
		{#if localCustomTemplates.size > 0}
			{#each Array.from(localCustomTemplates.entries()) as [key, template]}
				<InputGroup class="ps-2">
					<Input type="radio" bind:group={options.template_name} value={key} label="{key}" on:change={() => add_predicates_of_template(options.template_name)} />
				</InputGroup>
			{/each}
		{/if}
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
                <InputGroupText></InputGroupText>
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
				{#if Dumbo.is_core_template(options.template_name)}
					{@html Utils.render_markdown(Dumbo.core_template_documentation(options.template_name))}
				{:else if localCustomTemplates.has(options.template_name)}
					{@html Utils.render_markdown(localCustomTemplates.get(options.template_name).documentation)}
				{:else}
					<em>No documentation available for this template.</em>
				{/if}
                <hr />
                <pre class="position-relative p-2"><div class="position-absolute top-0 end-0" style="z-index: 1;"><button class="btn btn-secondary btn-sm" on:click={() => navigator.clipboard.writeText(pack_apply_template(options.template_name, options.predicate_mapping))} aria-label="copy"><i class="bi-clipboard-plus"></i></button></div><code>{pack_apply_template(options.template_name, options.predicate_mapping)}</code></pre>
            </div>
        {/if}
    </div>
</Operation>