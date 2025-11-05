<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Expand Templates";
    const default_extra_options = {
        program_predicate: '__program__',
		custom_template_input_predicate: "",
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                const program = [];
				const templates = [];
                part.forEach(atom => {
                    if (atom.predicate === options.program_predicate) {
                        program.push(Base64.decode(atom.terms[0].string));
                        return;
                    } else if (atom.predicate === options.custom_template_input_predicate) {
						templates.push(Base64.decode(atom.terms[0].string));
					}
                    input_part.push(atom);
                });
				const json = await Dumbo.fetch("template/expand-program/", {
                    program: templates.join('\n') + '\n' + program.join('\n'),
                });
                input_part.push(Dumbo.encode_program(json.program, options.program_predicate));
                res.push(input_part);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<InputGroup>
		<InputGroupText style="width: 10em;">Templates Library</InputGroupText>
		<Input type="text"
			   bind:value="{options.custom_template_input_predicate}"
			   placeholder="predicate"
			   on:input={edit}
		/>
	</InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Program</InputGroupText>
        <Input type="text"
               bind:value={options.program_predicate}
               placeholder="program predicate"
               on:input={edit}
        />
    </InputGroup>
</Operation>
