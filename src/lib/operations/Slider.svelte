<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Slider";
    const default_extra_options = {
        output_predicate: '__slider__',
        value: 1,
        min: 1,
        max: 10,
        label: "",
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return input.map(part => [...part, Utils.parse_atom(`${options.output_predicate}(${options.value})`)]);
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Tooltip} from "dumbo-svelte";
    import {readonly_ingredients} from "$lib/stores";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    $: readonly = (options && options.readonly) || $readonly_ingredients;
    let min = -999_999;
    let max = 999_999;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function start() {
        if (options.value > min) {
            options.value = min;
            edit();
        }
    }

    function prev() {
        if (options.value > min) {
            options.value -= 1;
            edit();
        }
    }

    function next() {
        if (options.value < max) {
            options.value += 1;
            edit();
        }
    }

    function end() {
        if (options.value < max) {
            options.value = max;
            edit();
        }
    }

    onMount(() => {
        listeners.set(id, (input) => {
            if (isNaN(options.min)) {
                min = Math.min(...input.flatMap(part => part.filter(atom => atom.predicate === options.min).map(atom => atom.terms[0].number)));
            } else {
                min = options.min;
            }
            if (isNaN(options.max)) {
                max = Math.max(...input.flatMap(part => part.filter(atom => atom.predicate === options.max).map(atom => atom.terms[0].number)));
            } else {
                max = options.max;
            }
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation extends input models with a new fact storing the given integer.
        </p>
        <p>
            The range of selectable values can be specified by means of constants or by (the first argument of) a predicate.
            If predicates are used, the extreme values among all models in input are used.
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 10em;">Label</InputGroupText>
        <Input type="text"
               bind:value={options.label}
               placeholder="Your custom label here"
               on:input={edit}
               data-testid="Slider-label"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Minimum value</InputGroupText>
        <Input type="text"
               bind:value={options.min}
               placeholder="min"
               on:input={edit}
               data-testid="Slider-min"
        />
        <InputGroupText style="width: 5em;"><code class="text-end w-100">{min}</code></InputGroupText>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Maximum value</InputGroupText>
        <Input type="text"
               bind:value={options.max}
               placeholder="max"
               on:input={edit}
               data-testid="Slider-max"
        />
        <InputGroupText style="width: 5em;"><code class="text-end w-100">{max}</code></InputGroupText>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Output predicate</InputGroupText>
        <Input type="text"
               bind:value={options.output_predicate}
               placeholder="output predicate"
               on:input={edit}
               data-testid="Slider-output-predicate"
        />
        <InputGroupText style="width: 5em;"><code class="text-end w-100">{options.value}</code></InputGroupText>
    </InputGroup>
    <div slot="output">
        {#if readonly && options.label}
            <InputGroup>
                <Input readonly="true" value="{options.label}" />
                <Button size="sm" title="Start" disabled={options.value <= min} on:click={() => start()}>
                    <Icon name="skip-start" />
                </Button>
                <Button size="sm" title="Previous" disabled={options.value <= min} on:click={() => prev()}>
                    <Icon name="arrow-left" />
                </Button>
                <InputGroupText class="float-end"><code>{options.value} in range {min}..{max}</code></InputGroupText>
                <Button size="sm" title="Next" disabled={options.value >= max} on:click={() => next()}>
                    <Icon name="arrow-right" />
                </Button>
                <Button size="sm" title="End" disabled={options.value >= max} on:click={() => end()}>
                    <Icon name="skip-end" />
                </Button>
            </InputGroup>
        {/if}
        <div class="m-3">
            <Tooltip value="{options.value} (range {min}..{max})" placement="top">
                <Input type="range"
                       min="{min}"
                       max="{max}"
                       bind:value="{options.value}"
                       on:input={edit}
                       />
                <Input type="number" class="d-test" bind:value={options.value} data-testid="Slider-value" />
            </Tooltip>
        </div>
    </div>
</Operation>
