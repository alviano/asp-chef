<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Javascript";
    const default_extra_options = {
        height: 500,
        code: '',
        options: {},
    };

    const TYPES = `
bool
color
date
datetime-local
email
month
number
password
range
search
tel
text
time
url
week
    `.trim().split('\n');

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)();
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        try {
            return options.code ? await Utils.worker_run(options.code, input, options.options) : input;
        } catch (error) {
            const res = [...input];
            Recipe.set_errors_at_index(index, error, res);
            return res;
        }
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "svelte-codemirror-editor";
    import {onDestroy, onMount} from "svelte";
    import Popover from "$lib/Popover.svelte";
    import {AutoHideBadge} from "dumbo-svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
    export let remote_name = undefined;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    let the_options = [];
    let name = '';
    let doc = '';
    let show_remote_code = false;

    function change_option(option, value) {
        options.options[option] = value;
        edit();
    }

    function set_options(describe) {
        the_options = describe.map(option => {
            const [name, type, placeholder, value] = Utils.split_with_limit(option.split, '|', 4);
            if (!(name in options.options)) {
                options.options[name] = value;
            }
            return {
                name,
                type: TYPES.includes(type) ? type : "text",
                placeholder,
                default: type !== "bool" ? value : !!value
            };
        });

    }
    async function listener() {
        try {
            let describe = await Utils.worker_run(options.code, [], "DESCRIBE");
            name = describe.name;
            doc = describe.doc;
            if ("options" in describe) {
                describe = describe.options;
            }
            set_options(describe);
        } catch (error) {
            Recipe.set_errors_at_index(index, error);
        }
    }

    function toggle_show_remote_code() {
        show_remote_code = !show_remote_code;
    }

    onMount(async () => {
        if (remote_name) {
            const remote = Recipe.get_remote_javascript_operation(remote_name);
            name = remote.name;
            doc = remote.doc;
            if (options) {
                options.code = remote.code;
                set_options(remote.options);
                edit();
            }
        } else {
            listeners.set(id, listener);
        }
    });

    onDestroy(() => {
        if (remote_name) {
            listeners.set(id, null);
        }
    });
</script>

<Operation {id} operation={remote_name || operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        {#if remote_name}
            {@html Utils.render_markdown(doc)}
        {:else}
            <p>
                The <strong>{operation}</strong> operation executes Javascript code over the <code>input</code> models.
            </p>
            <p>
                A function with arguments <code>input</code> and <code>options</code>, and the provided code is created and run in a worker.
                It must return an array of arrays of objects, where each object has the <code>str</code> property (which must be a parsable atom).
                Auxiliary functions can be defined within the code given in the ingredient.
            </p>
            <p>
                If <code>options</code> is <code>"DESCRIBE"</code>, the function must return an object with properties <code>name</code>, <code>doc</code> and <code>options</code>, where <code>options</code> is an array of strings of the form <code>OPTION_NAME|TYPE|PLACEHOLDER|DEFAULT_VALUE</code>.
                It is also acceptable to return just the array of options.
                <code>TYPE</code> must be one of {TYPES.join(', ')}.
            </p>
            <p>
                If the worker is terminated while executing the code given in the ingredient (for example, due to a change in the recipe), an <code>Error: Terminated</code> is reported.
            </p>
            <p>
                The <em>input</em> is an array of models.
                A <em>model</em> is an array of atoms.<br>
                An <em>atom</em> is an object with properties <code>predicate</code> (a string), <code>terms</code> (an array of terms) and <code>str</code> (a string).<br />
                A <em>term</em> is an object with property <code>str</code> (the string representation of the term) and one of the following properties:
                <code>number</code>,
                <code>string</code>,
                <code>functor</code> (a string; in this case there is also a property <code>terms</code>).
            </p>
            <p>
                <strong>Important!</strong>
                The Javascript code is run in an isolated worker and cannot access any library imported by ASP Chef.
                Dynamic imports are permitted.
                For example, <em>lodash</em> can be imported using<br />
                <code>const _ = (await import("https://esm.run/lodash")).default;</code>
            </p>
        {/if}
    </div>
    {#if !remote_name}
        <InputGroup>
            <InputGroupText>Height</InputGroupText>
            <Input type="number"
                   bind:value={options.height}
                   min="20"
                   step="20"
                   on:input={edit}
            />
        </InputGroup>
    {/if}
    {#if remote_name}
        <InputGroup>
            <Button block outline="{!show_remote_code}" on:click={toggle_show_remote_code}>Show code</Button>
        </InputGroup>
    {:else if doc}
        <Popover block title="{name}" class="mw-70">
            <div slot="value">
                {@html Utils.render_markdown(doc)}
            </div>
            <InputGroup>
                <InputGroupText class="w-100" style="font-weight: bold;">
                    {name}
                </InputGroupText>
            </InputGroup>
        </Popover>
    {/if}
    {#each the_options as option}
        {#if option.type !== "bool"}
            <InputGroup>
                <InputGroupText>{option.name}</InputGroupText>
                <Input type="{option.type}"
                       placeholder="{option.placeholder}"
                       value="{options.options[option.name]}"
                       on:input={(event) => change_option(option.name, event.srcElement.value)}/>
            </InputGroup>
        {:else}
            <Button block outline="{!options.options[option.name]}"
                    on:click={() => { options.options[option.name] = !options.options[option.name]; edit(); }}>{option.name}</Button>
        {/if}
    {/each}
    {#if !remote_name || show_remote_code}
        <div style="height: {options.height}px; overflow-y: auto" data-testid="Javascript-code">
            {#if remote_name}
                <AutoHideBadge color="warning">readonly</AutoHideBadge>
            {/if}
            <CodeMirror bind:value={options.code}
                        placeholder={`One or more lines of Javascript code...`}
                        lineWrapping="{true}"
                        readonly="{remote_name}"
                        on:change={edit}
            />
            <pre class="d-test">{options.code}</pre>
        </div>
    {/if}
</Operation>
