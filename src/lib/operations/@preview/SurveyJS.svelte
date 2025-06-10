<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@preview/SurveyJS";
    const default_extra_options = {
        predicate: "__survey__",
        output_predicate: "__output__",
        // instance_index: 0,
        multistage: false,
        echo: false,
        show_model_index: false,
        data: [],
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        const filtered = options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));

        if (!options.output_predicate) {
            return filtered;
        }

        return filtered.map((part, index) => {
            if (index < options.data.length && options.data[index] !== null) {
                const output_atoms = options.data[index].map(data => Utils.parse_atom(`${options.output_predicate}("${Base64.encode(JSON.stringify(data))}")`));
                return [...part, ...output_atoms];
            }
            return part;
        });
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import SurveyJS from "./+SurveyJS.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    // function checkIndex() {
    //     if (options.instance_index > options.data.length - 1 && options.instance_index !== 0) {
    //         options.instance_index = options.data.length - 1;
    //     }
    // }

    // function sync_input(input) {
    //     // why only the first model? we have to take from all models (and it's also not a nice solution)
    //     options.data = [
    //         input[0].filter(atom => atom.predicate === options.input_predicate).map(atom => {
    //             return { input: true, value: JSON.parse(Base64.decode(atom.terms[0].string)) };
    //         }),
    //         ...options.data.filter(record => !record.input),
    //     ];
    //
    //     if (options.data.length === 0) {
    //         options.data.push({ input: false, value: null });
    //     }
    // }

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function set_data(model_index, configuration_index, data) {
        if (!options.data[model_index]) {
            options.data[model_index] = [];
        }
        options.data[model_index][configuration_index] = data;
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
            // sync_input(input);
            // checkIndex();
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="SurveyJS-predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.show_model_index}" on:click={() => { options.show_model_index = !options.show_model_index; edit(); }}>Model Index</Button>
        <InputGroupText>Output Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:input={edit} data-testid="SurveyJS-Outputpredicate" />
    </InputGroup>
    <div slot="output">
<!--        <InputGroup>-->
<!--            <InputGroupText>Instance #</InputGroupText>-->
<!--            <Input type="number"-->
<!--                   bind:value={options.instanceIndex}-->
<!--                   min= "1"-->
<!--                   max={options.data.length}-->
<!--                   style="max-width: 5em;"-->
<!--                   on:blur={() => {-->
<!--                        if (options.instanceIndex < 1)-->
<!--                            options.instanceIndex = 1;-->
<!--                        if (options.instanceIndex > options.data.length)-->
<!--                            options.instanceIndex = options.data.length;-->
<!--                    }}-->
<!--                   />-->
<!--            <InputGroupText style={"flex: 1"}>of {options.data.length}</InputGroupText>-->
<!--            <ButtonGroup>-->
<!--                <Popover title="Jump to instance #1" value="Jump to the first instance of the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.instance_index = 1; edit(); }}><Icon name="chevron-double-left" /></Button>-->
<!--                </Popover>-->
<!--                <Popover title="Go to left" value="Move to the previous instance of the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.instance_index > 1 ? options.instance_index -= 1 : null; edit(); }}><Icon name="arrow-left"/></Button>-->
<!--                </Popover>-->
<!--                <Popover title="Go to right" value="Move to the next instance of the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.instance_index < options.data.length ? options.instance_index += 1 : null; edit(); }}><Icon name="arrow-right"/></Button>-->
<!--                </Popover>-->
<!--                <Popover title="Jump to the last instance" value="Jump to the last instance of the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.instance_index = options.data.length; edit(); }}><Icon name="chevron-double-right" /></Button>-->
<!--                </Popover>-->
<!--            </ButtonGroup>-->
<!--            <ButtonGroup>-->
<!--                <Popover title="Add instance" value="Add a new instance to the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.data.push({ input: false, value: null }); options.instance_index = options.data.length; edit(); }}><Icon name="plus-lg"/></Button>-->
<!--                </Popover>-->
<!--                <Popover title="Remove instance" value="Remove instance #{options.instance_index} from the Survey">-->
<!--                    <Button size="lg" outline="{true}" on:click={() => { options.data.length > 1 ? options.data.splice(options.instance_index, 1) : options.data[0] = { input: false, value: null }; if(options.instance_index > 1) options.instance_index -= 1; edit(); }}><Icon name="trash"/></Button>-->
<!--                </Popover>-->
<!--            </ButtonGroup>-->
<!--        </InputGroup>-->
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if options.show_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                {#key model}
                    {#each model.filter(atom => atom.predicate === options.predicate) as configuration, configuration_index}
                            <!--input="{options.data[options.instance_index]?.value}"-->
                        <SurveyJS
                            part="{model}"
                            index="{index}"
                            configuration_atom="{configuration}"
                            multistage="{options.multistage}"
                            data="{options.data[model_index] ? options.data[model_index][configuration_index] : null}"
                            on_ok="{(data) => { set_data(model_index, configuration_index, data); edit(); }}"
                            on_clear="{() => { set_data(model_index, configuration_index, null); edit(); }}"
                        />
                    {/each}
                {/key}
            {/each}
        </div>
    </div>
</Operation>
