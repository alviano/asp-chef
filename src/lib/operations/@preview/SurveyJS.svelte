<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@preview/SurveyJS";
    const default_extra_options = {
        predicate: "__survey__",
        input_predicate: "__input__",
        output_predicate: "__output__",
        instance_index: 0,
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

        const result = options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));
        
        const res = options.data && options.data.length > 0 ? result.map(part => [...part, Utils.parse_atom(`${options.output_predicate}("${Base64.encode(JSON.stringify(options.data?.map(result => result.output).filter(result => result!=null)))}")`)]) : result;
        
        return res;
    });
</script>

<script>
    import {Button, ButtonGroup, Icon, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import SurveyJS from "./+SurveyJS.svelte";
	import { merge } from "vega";
	import Popover from "$lib/Popover.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];
    let jsons = [];
    let previousInput = null;
    let previousInputPredicate = null;

    $: displayedIndex = options ? options.instance_index + 1 : 1;

    function checkIndex(){
        if(options.instance_index>options.data.length-1 && options.instance_index !== 0)
            options.instance_index = options.data.length-1;
    }

    function sync_input(input){
        if(previousInput !== input || (options.input_predicate !== previousInputPredicate)){

            jsons = Utils.extract_json_objects(input, options.input_predicate);
            
            jsons.forEach(json =>{
                const exists = options.data.some(existing => Utils.compare_jsons(existing.input, json));

                if(!exists){
                    options.data.push({predicate: options.input_predicate, input: json, value: json, output: null});
                }
            });

            options.data = options.data.filter(json => (jsons.some(new_json => Utils.compare_jsons(json.input, new_json)) || (json.input === null && json.predicate === options.input_predicate)))
            .sort((a,b)=>{
                if (a.input === null && b.input !== null) return 1;
                if (a.input !== null && b.input === null) return -1;
                return 0;
            });
                
            if(options.data.length === 0){
                options.data.push({predicate: options.input_predicate, input: null, value: null, output: null});
            }

            previousInput = input;
        }
        if(previousInputPredicate !== options.input_predicate)
            previousInputPredicate = options.input_predicate;
    }

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
            sync_input(input);
            previousInput = input;
            checkIndex();
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
    </InputGroup>
    <InputGroup>
        <InputGroupText>Input Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.input_predicate} on:input={edit} data-testid="SurveyJS-Inputpredicate" />
        <InputGroupText>Output Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:input={edit} data-testid="SurveyJS-Outputpredicate" />
    </InputGroup>
    <InputGroup>
        <InputGroupText>Instance #</InputGroupText>
        <Input type="number"
               bind:value={displayedIndex}
               min= "1"
               max={options.data.length}
               style="max-width: 5em;"
               on:blur={() => {
                    if (displayedIndex < 1) 
                        displayedIndex = 1;
                    if (displayedIndex > options.data.length) 
                        displayedIndex = options.data.length;
                    options.instance_index = displayedIndex - 1;
                }}
               />
        <InputGroupText style={"flex: 1"}>of {options.data.length}</InputGroupText>
        <ButtonGroup>
            <Popover title="Jump to instance #1" value="Jump to the first instance of the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.instance_index = 0; edit(); }}><Icon name="chevron-double-left" /></Button>
            </Popover>
            <Popover title="Go to left" value="Move to the previous instance of the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.instance_index>0 ? options.instance_index -= 1 : options.instance_index; edit(); }}><Icon name="arrow-left"/></Button>
            </Popover>
            <Popover title="Go to right" value="Move to the next instance of the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.instance_index<options.data.length-1 ? options.instance_index += 1 : options.instance_index; edit(); }}><Icon name="arrow-right"/></Button>
            </Popover>
            <Popover title="Jump to the last instance" value="Jump to the last instance of the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.instance_index = options.data.length-1; edit(); }}><Icon name="chevron-double-right" /></Button>
            </Popover>
        </ButtonGroup>
        <ButtonGroup>
            <Popover title="Add instance" value="Add a new instance to the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.data.push({predicate: options.input_predicate, input: null, value: null, output: null}); options.instance_index = options.data.length-1; edit(); }}><Icon name="plus-lg"/></Button>
            </Popover>
            <Popover title="Remove instance" value="Remove instance #{options.instance_index + 1} from the Survey">
                <Button size="lg" outline="{true}" on:click={() => { options.data.length>1 ? options.data.splice(options.instance_index, 1) : options.data[0] = {predicate: options.output_predicate, input: null, value: null, output: null}; if(options.instance_index>0) options.instance_index-= 1; edit(); }}><Icon name="trash"/></Button>
            </Popover>
        </ButtonGroup>
    </InputGroup>
    <div slot="output">
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if options.show_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                {#key model}
                    {#each model.filter(atom => atom.predicate === options.predicate) as configuration}
                        <!--<SurveyJS input="{currentInput}" part="{model}" index="{index}" configuration_atom="{configuration}" multistage="{options.multistage}"
                                on_output_change="{(d) => { options.data[options.instance_index].output = d; edit(); } }" on_value_change="{(d) => { options.data[options.instance_index].value = d; edit(); } }"  />-->
                            <SurveyJS
                                input="{options.data[options.instance_index]?.value}"
                                part="{model}"
                                index="{index}"
                                configuration_atom="{configuration}"
                                multistage="{options.multistage}"
                                on_output_change="{(d) => { options.data[options.instance_index].output = d; edit(); }}"
                                on_value_change="{(d) => { options.data[options.instance_index].value = d; edit(); }}"
                            />
                    {/each}
                {/key}
            {/each}
        </div>
    </div>
</Operation>
