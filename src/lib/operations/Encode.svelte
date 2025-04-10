<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
	import { json } from '@codemirror/lang-json';
	import { python } from '@codemirror/lang-python';
	import { javascript } from '@codemirror/lang-javascript';

    const operation = "Encode";
    const default_extra_options = {
        height: 200,
        predicate: '__base64__',
        content: '',
        language: '',
    };

    const languages = new Map();
    languages.set('', null);
    languages.set('JavaScript', javascript());
    languages.set('JSON', json());
    languages.set('Python', python());

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(options.content);
        const res = [];
        try {
            const encoded_content = Utils.parse_atom(`${options.predicate}("${content}")`);
            input.forEach(part => res.push([...part, encoded_content]));
        } catch (error) {
            Recipe.set_errors_at_index(index, error, res);
        }
        return res;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "svelte-codemirror-editor";

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
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               style="max-width: 5em;"
               on:input={edit}
        />
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <InputGroupText>Language</InputGroupText>
        <Input type="select"
               bind:value="{options.language}"
               placeholder="language"
               on:change={edit}
        >
            {#each languages.keys() as language}
                <option value={language}>{language}</option>
            {/each}
        </Input>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Encode-content">
        <CodeMirror bind:value={options.content}
                    placeholder={`One or more lines...`}
                    lineWrapping="{true}"
                    extensions={options.language && languages.has(options.language) ? [languages.get(options.language)] : []}
                    on:change={edit}
        />
        <pre class="d-test">{options.content}</pre>
    </div>
</Operation>
