<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";

    const operation = "@dumbo/Template Documentation";
    const default_extra_options = {
        height: 500,
        filter: "",
        show_rules: false,
        output_predicate: "",
		custom_template_input_predicate: "",
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input, options);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }


        if (!options.output_predicate) {
            return input;
        }

        const templates = await Dumbo.fetch_core_templates();
        const new_atoms = [];
        for (let template of templates.filter(template => template.match(new RegExp(options.filter, 'i')))) {
            const doc = Dumbo.core_template_documentation(template);
            const rules = Dumbo.core_template_program(template);
            const content = Base64.encode(
                `## ${template}\n\n${doc}` + (options.show_rules ? `\n\n#### Template Rules\n\n\`\`\`\n${rules}\n\`\`\`` : '')
            );
            const encoded_content = `${options.output_predicate}("${content}")`;
            new_atoms.push(Utils.parse_atom(encoded_content));
        }
        return input.map(part => [...part, ...new_atoms]);
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output_div;

    let templates = [];
	let localCustomTemplates = new Map();

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(async () => {
        if (id !== undefined) {
            templates = await Dumbo.fetch_core_templates();
        }

        listeners.set(id, async (input, options) => {
            if (!output_div) {
                return;
            }
			const program = [];
			for (const part of input) {
				part.forEach(atom => {
					if (atom.predicate === options.custom_template_input_predicate) {
						program.push(Base64.decode(atom.terms[0].str));
					}
				});
			}
			try {
				localCustomTemplates = new Map();
				if (program) {
					const response = await Dumbo.fetch('template/parse-custom-template/', { program: program.join('\n') });
					for (const [name, template] of Object.entries(response)) {
						const predicates = template.predicates.map(pred => `\`${pred}\``).join(', ');
						template.documentation = `__Predicates:__ ${predicates}\n\n` + template.documentation.replaceAll('\n', '\n\n').replaceAll('\\n', '\n');
						localCustomTemplates.set(name, template);
					}
					localCustomTemplates = new Map(localCustomTemplates);
				}
			}
			catch (error) {
				Recipe.set_errors_at_index(index, error);
			}
            await tick();
            Array.from(output_div.getElementsByTagName('pre')).forEach(Utils.add_copy_button);
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<InputGroup>
		<InputGroupText style="width: 10em;">Templates Library</InputGroupText>
		<Input type="text"
			   bind:value="{options.custom_template_input_predicate}"
			   placeholder="predicate"
			   on:input={edit}
		/>
		<InputGroupText>Height</InputGroupText>
		<Input type="number"
			   bind:value={options.height}
			   min="20"
			   step="20"
			   style="max-width: 5em;"
			   on:input={edit}
		/>
		<Button outline="{!options.show_rules}" on:click={() => { options.show_rules = !options.show_rules; edit(); }}>Show Rules</Button>
	</InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Output predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.output_predicate}"
               placeholder="predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <Input type="search"
               id="doc-search"
               bind:value={options.filter}
               placeholder="Filter operations..."
               autocomplete="off"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output" style="height: {options.height}px; overflow-y: auto" data-testid="Documentation-content" bind:this={output_div}>
        {#each templates.filter(template => template.match(new RegExp(options.filter, 'i'))) as template}
            <div style="margin: 0.5em">
                <h2>{template}</h2>
                {@html Utils.render_markdown(Dumbo.core_template_documentation(template))}
                {#if options.show_rules}
                    <h4>Template Rules</h4>
                    {@html Utils.render_markdown('```asp\n' + Dumbo.core_template_program(template) + '\n```')}
                {/if}
            </div>
            <hr />
        {/each}
		{#if localCustomTemplates.size > 0}
			<h1>Custom Templates</h1>
			{#each Array.from(localCustomTemplates.entries()) as [key, template]}
				<div style="margin: 0.5em">
					<h3>{key}</h3>
					{@html Utils.render_markdown(template.documentation)}
					{#if options.show_rules}
						<h4>Template Rules</h4>
						{@html Utils.render_markdown('```asp\n' + template.program + '\n```')}
					{/if}
				</div>
				<hr />
			{/each}
		{/if}
    </div>
</Operation>
