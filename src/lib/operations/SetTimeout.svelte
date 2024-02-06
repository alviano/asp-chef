<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Set Timeout";
    const default_extra_options = {
        seconds: 5,
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        Utils.clingo_timeout = options.seconds;
        return input;
    });
</script>

<script>
    import {Input} from "sveltestrap";
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
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation sets the timeout for subsequent calls to clingo.
        </p>
        <p>
            An error is generated if the timeout is reached.
            Note that some extra time is required to recover the system, and refreshing the page is also required in some cases.
        </p>
        <p>
            Default value: <code>5 seconds</code>
        </p>
    </div>
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
