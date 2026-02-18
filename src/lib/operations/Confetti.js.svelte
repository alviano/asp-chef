<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils.js";

    const operation = "Confetti.js";
    const default_extra_options = {
        predicate: "__confetti__",
        multistage: false,
        echo: false,
    };

    let confetti = null;
    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        if (confetti === null) {
            try {
                //const {confetti: the_confetti} = (await import("https://esm.run/tsparticles-confetti@2.12.0/tsparticles.confetti.bundle.min.js"));
                //confetti = the_confetti;
            } catch (error) {
                console.error(error);
                return input;
            }
        }

        for (const model of input) {
            for (const atom of model.filter(atom => atom.predicate === options.predicate)) {
                if (atom.terms.length !== 1) {
                    Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. ${operation}`);
                    continue;
                }
                const content = Base64.decode(atom.terms[0].string);
                const expanded_content = await Utils.expand_mustache_queries(model, content, index, options.multistage);
                const configuration = Utils.parse_relaxed_json(expanded_content);
                await confetti(configuration);
            }
        }
        return options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";

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
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="ApexCharts-predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
</Operation>
