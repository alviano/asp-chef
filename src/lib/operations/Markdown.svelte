<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Markdown";
    const default_extra_options = {
        predicate: '__base64__',
        echo: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(model => model.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";


    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output = '';

    function edit() {
        Recipe.edit_operation(index, options);
    }

    function check_one_term_string(atom) {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`)
            return false;
        } else if (atom.terms[0].string === undefined) {
            Utils.snackbar(`Wrong argument in \#${index}. Markdown: ${atom.str}`)
            return false
        } else {
            return true;
        }
    }

    onMount(() => {
        listeners.set(id, async (input) => {
            const the_output = [];
            for (let model of input) {
                const output_part = [];
                let separator = '\n';
                let term_separator = ', ';
                let prefix = '';
                let suffix = '';
                for (let atom of model.filter(atom => atom.predicate === options.predicate)) {
                    let md = Base64.decode(atom.terms[0].string);
                    const matches = md.matchAll(/\{\{(((?!}}).)*)}}/gs);
                    if (matches !== null) {
                        for (let the_match of matches) {
                            const match = the_match[1].trim();
                            const program = model.map(atom => `${atom.str}.`).join('\n') + '\n#show.\n#show ' + match + (match.endsWith('.') ? '' : '.');
                            const query_answer = await Utils.search_models(program, 1, true);
                            let matrix = null;

                            const replacement = [];
                            if (query_answer.length === 1) {
                                Utils.parse_atoms(query_answer[0]).forEach(atom => {
                                    if (atom.functor === undefined && atom.predicate === undefined) {
                                        atom.functor = '';
                                        atom.terms = [atom];
                                    }
                                    const terms = atom.terms.map(term => term.string || term.str);
                                    if (atom.functor === '') {
                                        replacement.push(prefix + terms.join(term_separator) + suffix);
                                    } else if (atom.predicate === 'matrix') {
                                        if (matrix === null) {
                                            matrix = [];
                                        }
                                        if (atom.terms.length < 3) {
                                            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`)
                                        } else {
                                            const row = atom.terms[0].number;
                                            const col = atom.terms[1].number;
                                            const value = prefix + terms.slice(2).join(term_separator) + suffix;

                                            while (matrix.length < row) {
                                                matrix.push([]);
                                            }
                                            while (matrix[row-1].length < col) {
                                                matrix[row-1].push("");
                                            }

                                            matrix[row-1][col-1] = value;
                                        }
                                    } else if (atom.predicate === 'prefix') {
                                        if (check_one_term_string(atom)) {
                                            prefix = atom.terms[0].string;
                                        }
                                    } else if (atom.predicate === 'suffix') {
                                        if (check_one_term_string(atom)) {
                                            suffix = atom.terms[0].string;
                                        }
                                    } else if (atom.predicate === 'separator') {
                                        if (check_one_term_string(atom)) {
                                            separator = atom.terms[0].string;
                                        }
                                    } else if (atom.predicate === 'term_separator') {
                                        if (check_one_term_string(atom)) {
                                            term_separator = atom.terms[0].string;
                                        }
                                    } else if (atom.predicate === 'table') {
                                        if (atom.terms.length !== 0) {
                                            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                                        } else {
                                            prefix = '|';
                                            term_separator = '|'
                                            suffix = '|';
                                            separator = '\n';
                                        }
                                    } else if (atom.predicate === 'list') {
                                        if (atom.terms.length !== 0) {
                                            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                                        } else {
                                            prefix = '- ';
                                            term_separator = ', '
                                            suffix = '';
                                            separator = '\n';
                                        }
                                    } else if (atom.predicate === 'default') {
                                        if (atom.terms.length !== 0) {
                                            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                                        } else {
                                            prefix = '';
                                            term_separator = ', '
                                            suffix = '';
                                            separator = '\n';
                                        }
                                    } else {
                                        Utils.snackbar(`Unknown predicate in \#${index}. Markdown: ${atom.predicate}`);
                                    }
                                });
                            }
                            if (matrix !== null) {
                                replacement.push(matrix.map(row => "|" + row.join("|") + "|").join("\n"));
                            }
                            md = md.replace(the_match[0], replacement.join(separator));
                        }
                    }
                    output_part.push(md);
                }
                the_output.push(output_part.join('\n'));
            }
            output = the_output.join(consts.SYMBOLS.MODELS_SEPARATOR);
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation shows the markdown encoded content in each model in input.
        </p>
        <p>
            Models can be queried with the mustache syntax
            <code>{`{{ (terms) : conjunctive_query }}`}</code>
        </p>
        <p>
            The separator of obtained substitutions can be specified with
            <code>{`{{ separator("\n") }}`}</code>.
            Similarly, <code>term_separator/1</code>, <code>prefix/1</code> and <code>suffix/1</code> can be used to customize the print of each obtained substitution.
            Finally, <code>table/0</code>, <code>list/0</code> and <code>default/0</code> can be used to set the above four parameters to accommodate specific common output formats.
        </p>
        <p>

        </p>
        <p>
            The input is echoed in output.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="Markdown-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div class="p-2 output" data-testid="Markdown-output">
        {@html Utils.render_markdown(output)}
    </div>
</Operation>

<style >
    .output :global(td), .output :global(th) {
        border: 1px solid #ddd;
        padding: 8px;
    }

    .output :global(tr:nth-child(even)) {
        background-color: #f2f2f2;
    }

    .output :global(tr:hover) {
        background-color: #ddd;
    }

    .output :global(th) {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #777;
        color: white;
    }
</style>