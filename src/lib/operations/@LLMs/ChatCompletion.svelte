<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {LLMs} from "$lib/operations/@LLMs/llms";
    import {Utils} from "$lib/utils";

    const operation = "@LLMs/Chat Completion";
    const default_extra_options = {
        config: '__llms_config__',
        message: '__message__',
        system: '__system__',
        user: '__user__',
        assistant: '__assistant__',
        echo_message: false,
        echo_system: false,
        echo_user: false,
        echo_assistant: false,
        output: '__base64__',
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        if (!options.config || !options.config || !options.output || (!options.message && !options.system && !options.user && !options.assistant)) {
            return input;
        }

        let res = [];
        for (const part of input) {
            try {
                const res_part = [];

                let server_type = null;
                let server = null;
                let endpoint = '';
                let model = null;
                let temperature = null;
                const messages = [];

                part.forEach(atom => {
                    if (atom.predicate === options.config) {
                        if (!atom.terms || atom.terms.length !== 2 || !atom.terms[0].functor || (atom.terms[0].terms && atom.terms[0].terms.length > 0) || (atom.terms[1].string !== "" && !atom.terms[1].string)) {
                            Utils.snackbar(`@LLMs/Chat Completion: Cannot interpret configuration atom ${atom.str}`)
                        } else {
                            if (atom.terms[0].functor === 'server_type') {
                                server_type = LLMs.decode_string(atom.terms[1].string);
                            } else if (atom.terms[0].functor === 'server') {
                                server = LLMs.decode_string(atom.terms[1].string);
                            } else if (atom.terms[0].functor === 'endpoint') {
                                endpoint = LLMs.decode_string(atom.terms[1].string);
                            } else if (atom.terms[0].functor === 'model') {
                                model = LLMs.decode_string(atom.terms[1].string);
                            } else if (atom.terms[0].functor === 'temperature') {
                                temperature = LLMs.decode_string(atom.terms[1].string);
                            } else {
                                Utils.snackbar(`@LLMs/Chat Completion: Cannot interpret configuration atom ${atom.str}`)
                            }
                        }
                    } else if (atom.predicate === options.message && atom.terms && atom.terms.length === 1 &&
                        ["system", "user", "assistant"].includes(atom.terms[0].functor) && atom.terms[0].terms.length === 1 && atom.terms[0].terms[0].string) {
                        messages.push({
                            role: atom.terms[0].functor,
                            content: atom.terms[0].terms[0].string,
                        });
                        if (!options.echo_message) {
                            return;
                        }
                    } else if (atom.terms && atom.terms.length === 1 && atom.terms[0].string &&
                        (atom.predicate === options.system || atom.predicate === options.user || atom.predicate === options.assistant)) {
                        const role = atom.predicate === options.system ? "system" : atom.predicate === options.user ? "user" : "assistant";
                        messages.push({
                            role: role,
                            content: Base64.decode(atom.terms[0].string),
                        });
                        if (!options[`echo_${role}`]) {
                            return;
                        }
                    }

                    res_part.push(atom);
                });

                if (server_type && server && model && messages) {
                    validate_server_type(server_type);

                    const api_key = await LLMs.access_api_key(server);
                    if (api_key) {
                        for (let message_index = 0; message_index < messages.length; message_index++) {
                            const message = messages[message_index].content;
                            messages[message_index].content = await Utils.markdown_expand_mustache_queries(part, message, index);
                        }
                        const response = await call_server(server_type, server, api_key, endpoint, model, temperature, messages);
                        const text = response.choices ? response.choices[0].message.content : response.message.content;
                        const content = Base64.encode(text);
                        const encoded_content = Utils.parse_atom(`${options.output}("${content}")`);
                        res_part.push(encoded_content);
                    }
                }

                res.push(res_part);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });

    function validate_server_type(server_type) {
        if (!["Groq", "OpenAI", "Ollama"].includes(server_type)) {
            throw new Error(`${operation}: Unknown server type ${server_type}`)
        }
    }

	async function call_server(server_type, server, api_key, endpoint, model, temperature, messages) {
        const props = {};
        if (temperature !== null) {
            LLMs.add_temperature(server_type, temperature, props);
        }

        const response = await fetch(`${server}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`, {
            method: "POST",
            mode: "cors",
            cache: Utils.browser_cache_policy,
            credentials: "same-origin",
            headers: new Headers([
                ["Authorization", `Bearer ${api_key}`],
                ["Content-Type", "application/json"],
            ]),
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                ...props,
            }),
        });
        const json = await response.json();
        if (json.error) {
            throw new Error(`${operation}: ${json.error.message}`);
        }
        return json;
    }

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
        <InputGroupText style="width: 8em;">Configuration</InputGroupText>
        <Input type="text"
               bind:value="{options.config}"
               placeholder="__config__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-config"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Messages</InputGroupText>
        <Input type="text"
               bind:value={options.message}
               placeholder="__message__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-messages"
        />
        <Button outline="{!options.echo_message}" on:click={() => { options.echo_message = !options.echo_message; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">System role</InputGroupText>
        <Input type="text"
               bind:value={options.system}
               placeholder="__system__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-system-role"
        />
        <Button outline="{!options.echo_system}" on:click={() => { options.echo_system = !options.echo_system; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">User role</InputGroupText>
        <Input type="text"
               bind:value={options.user}
               placeholder="__user__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-user-role"
        />
        <Button outline="{!options.echo_user}" on:click={() => { options.echo_user = !options.echo_user; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Assistant role</InputGroupText>
        <Input type="text"
               bind:value={options.assistant}
               placeholder="__assistant__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-assistant-role"
        />
        <Button outline="{!options.echo_assistant}" on:click={() => { options.echo_assistant = !options.echo_assistant; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Output</InputGroupText>
        <Input type="text"
               bind:value="{options.output}"
               placeholder="__base64__"
               on:input={edit}
               data-testid="@LLMs/ChatCompletion-output"
        />
    </InputGroup>
</Operation>