<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Timer";
    const default_extra_options = {
        seconds: 5,
        output_predicate: "__timer__",
        active: true,
    };

    const intervals = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        options.seconds = Math.max(options.seconds, 1);
        if (!options.active || !intervals.has(id) || intervals.get(id).seconds !== options.seconds) {
            if (intervals.has(id)) {
                clearInterval(intervals.get(id).interval);
                intervals.delete(id);
            }
            if (options.active) {
                const interval = setInterval(() => {
                    Recipe.invalidate_cached_output(index);
                    Recipe.edit_operation(id, index, options);
                }, options.seconds * 1000);
                intervals.set(id, {
                    interval,
                    seconds: options.seconds,
                });
            }
        }
        const date = new Date();
        return options.output_predicate ? input.map(part => [...part, Utils.parse_atom(`${options.output_predicate}(${date.getHours()}, ${date.getMinutes()}, ${date.getSeconds()})`)]) : input;
    });

    Recipe.new_uncachable_operation_type(operation);
</script>

<script>
    import {Badge, Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let seconds = options ? options.seconds % 60 : 5;
    let minutes = options ? Math.floor((options.seconds % 3600) / 60) : 0;
    let hours = options ? Math.floor(options.seconds / 3600) : 0;

    function edit() {
        options.seconds = seconds + 60 * minutes + 3600 * hours;
        Recipe.edit_operation(id, index, options);
    }

    function toggle_active() {
        options.active = !options.active;
        edit();
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation invalidate the cache after an interval (of 1 second or more).
        </p>
        <p>
            It can be used to implement <em>regular polling</em> to external servers (e.g., if followed by <strong>HackMD</strong>).
        </p>
        <p>
            If an output predicate is specified, the current time is added as a fact of the form <code>__timer__(HOURS, MINUTES, SECONDS).</code>
        </p>
        <p>
            <strong>Attention!</strong>
            Skipping a timer ingredient does not clear the installed interval.
            If you want to temporarily disable a timer, click the <Badge>ACTIVE</Badge> button <strong>before</strong> skipping the ingredient.
        </p>
        <p>
            Default value: <code>5 seconds</code>
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 10em;">Output predicate</InputGroupText>
        <Input type="text"
               bind:value={options.output_predicate}
               placeholder="output predicate"
               on:input={edit}
               data-testid="Timer-output-predicate"
        />
        <Button outline="{!options.active}" on:click={toggle_active}>Active</Button>
    </InputGroup>
    <div class="m-3">
        <Input type="range"
               min="{0}"
               max="{59}"
               bind:value="{seconds}"
               on:change={edit}
               title="Seconds"
               />
        <Input type="range"
               min="{0}"
               max="{59}"
               bind:value="{minutes}"
               on:change={edit}
               title="Minutes"
               />
        <Input type="range"
               min="{0}"
               max="{23}"
               bind:value="{hours}"
               on:change={edit}
               title="Hours"
               />
        <code class="float-start">
            {hours} hours, {minutes} minutes and {seconds % 60} seconds
        </code>
        <code class="float-end">
            {options.seconds} seconds
        </code>
    </div>
</Operation>
