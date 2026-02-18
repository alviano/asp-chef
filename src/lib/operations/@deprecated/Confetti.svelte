<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";

    const operation = "@deprecated/Confetti";
    const default_extra_options = {
        height: 200,
        config_predicate: '__confetti__',
        echo: false,
        config: `{
  "particleCount": 100,
  "spread": 70,
  "origin": { "y": 0.6 }
}`,
    };

    let confetti = null;
    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (confetti === null) {
            try {
                const {confetti: the_confetti} = (await import("https://esm.run/tsparticles-confetti@2.12.0/tsparticles.confetti.bundle.min.js"));
                confetti = the_confetti;
            } catch (error) {
                console.error(error);
                return input;
            }
        }

        const res = [];
        let config = options.config;
        try {
            input.forEach(part => {
                const model = [];
                part.forEach(atom => {
                    if (options.config_predicate && atom.predicate === options.config_predicate) {
                        confetti(JSON.parse(Base64.decode(atom.terms[0].string)));
                        if (!options.echo) {
                            return;
                        }
                    }
                    model.push(atom);
                })
                res.push(model);
            });
            if (config) {
                confetti(JSON.parse(config));
            }
        } catch (error) {
            Recipe.set_errors_at_index(index, "Error: " + error, res);
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";

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
        <InputGroupText>Configuration</InputGroupText>
        <Input type="text"
               bind:value="{options.config_predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Confetti-code">
        <CodeMirror bind:value={options.config}
                    placeholder={`A JSON configuration object...`}
                    lineWrapping="{true}"
                    onchange={edit}
        />
        <pre class="d-test">{options.config}</pre>
    </div>
</Operation>
