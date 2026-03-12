<script>
    import {
        Button,
        ButtonGroup,
        Input,
        InputGroup,
        InputGroupText,
        Spinner,
        Alert
    } from '@sveltestrap/sveltestrap';
    import { onMount } from 'svelte';
    import { Base64 } from 'js-base64';
    import { Utils } from '$lib/utils.js';
    import { Recipe } from '$lib/recipe';
    import { LLMs } from '$lib/operations/@LLMs/llms';
    import { ChatOpenAI } from '@langchain/openai';
    import { HumanMessage, SystemMessage } from '@langchain/core/messages';
    import queryProgram from '$lib/operations/@DTDL/res/query.lp?raw';
    import yaml from 'js-yaml';

    export let id;
    export let inputData;
    export let options;
    export let index;
    let isProcessing = false;
    let naturalLanguageQuery = '';
    let generatedASP = '';
    let queryResults = [];
    let naturalLanguageAnswer = '';

    let default_config = {
        model: 'qwen/qwen2.5-coder-7b-instruct',
        temperature: 0,
        streamUsage: false,
        apiKey: '',
        baseURL: 'https://openrouter.ai/api/v1',
        predicate_config: '__llms_config__'
    };

    let actual_config = {};

    // Example queries for user reference
    const exampleQueries = [
        'Quali interfacce hanno sensori di temperatura?',
        'Trova tutte le interfacce che possono comunicare con SoilMoistureSensor',
        'Elenca le proprietà scrivibili di ogni interfaccia',
        'Quali interfacce hanno più di 3 relationships?',
        'Mostra tutti i comandi disponibili nel modello',
        'Find interfaces with writable properties',
        'Show all telemetries with their schemas'
    ];

    function useExampleQuery(query) {
        naturalLanguageQuery = query;
    }

    function shortId(dtmi) {
        if (!dtmi) return dtmi;
        const parts = dtmi.split(':');
        return parts[parts.length - 1];
    }

    async function executeQuery() {
        if (!naturalLanguageQuery.trim()) {
            Utils.snackbar('Please enter a query in natural language.');
            return;
        }

        if (!inputData || inputData.length === 0) {
            Utils.snackbar('No DTDL data available. Make sure to connect @DTDL/Parse output.');
            return;
        }

        isProcessing = true;
        queryResults = [];
        generatedASP = '';
        naturalLanguageAnswer = '';

        // try {
        // 	// Step 1: Generate ASP query from natural language
        await generateASPQuery();

        // Step 2: Execute the ASP query
        await runASPQuery();

        // Step 3: Generate natural language answer from results
        await generateNaturalLanguageAnswer();
        // } catch (error) {
        // 	Utils.snackbar(`Query error: ${error.message}`);
        // 	console.error(error);
        // } finally {
        // 	isProcessing = false;
        // }
    }

    async function generateASPQuery() {
        if (!actual_config.api_key || !actual_config.api_key.startsWith('sk-')) {
            Utils.snackbar(
                'Please enter your OpenRouter API key. Get it for free at https://openrouter.ai/'
            );
            return;
        }

        const chat = new ChatOpenAI({
            model: actual_config.model || default_config.model,
            temperature: parseFloat(actual_config.temperature || default_config.temperature || 0),
            streamUsage: actual_config.streamUsage || default_config.streamUsage || false,
            apiKey: actual_config.api_key,
            configuration: {
                baseURL:
                    (actual_config.server || default_config.baseURL) +
                    (actual_config.endpoint || '')
            }
        });

        const systemPrompt = `You are an expert in Answer Set Programming (ASP) and DTDL (Digital Twin Definition Language).

Given a DTDL model represented as ASP facts, you must translate natural language queries into ASP queries.

Available DTDL predicates:
- interface(InterfaceId) - defines an interface
- displayName(InterfaceId, Name) - interface display name
- has_property(InterfaceId, PropName, PropId) - property of an interface
- has_telemetry(InterfaceId, TelName, TelId) - telemetry of an interface
- has_command(InterfaceId, CmdName, CmdId) - command of an interface
- has_relationship(InterfaceId, RelName, RelId) - relationship of an interface
- has_component(InterfaceId, CompName, CompId) - component of an interface
- schema(ElementId, SchemaType) - schema type (e.g., "double", "string", "integer")
- writable(ElementId) - indicates a writable property/relationship
- target(RelId, TargetInterface) - target of a relationship
- description(ElementId, Text) - description text
- comment(ElementId, Text) - comment text

Helper predicates available (from query.lp):
- can_communicate(I1, I2, Hops) - communication path between interfaces
- relationship_count(Interface, Count) - count relationships per interface
- telemetry_count(Interface, Count) - count telemetries per interface
- property_count(Interface, Count) - count properties per interface

Your task: translate the user query into ASP rules that compute the answer.
Output ONLY the ASP code, without explanations. Use #show directives to display results.

Example:
Query: "Find interfaces with temperature telemetry"
ASP:
has_temp(I, TelName) :- has_telemetry(I, TelName, TelId), schema(TelId, "double"),
    (TelName = "temperature"; TelName = "temp"; TelName = "soilTemperature").
#show has_temp/2.

Example:
Query: "Which interfaces can communicate with VineyardPlot?"
ASP:
can_reach_plot(I, Hops) :- can_communicate(I, Target, Hops), Target = "dtmi:agriculture:vineyard:VineyardPlot;1".
#show can_reach_plot/2.

Example:
Query: "List all writable properties"
ASP:
writable_prop(I, PropName) :- has_property(I, PropName, PropId), writable(PropId).
#show writable_prop/2.

Now translate this query:`;

        const response = await chat.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Query: "${naturalLanguageQuery}"\n\nASP code:`)
        ]);

        generatedASP = response.content.trim();

        // Clean up the response - remove markdown code blocks if present
        generatedASP = generatedASP
            .replace(/```asp\n/g, '')
            .replace(/```prolog\n/g, '')
            .replace(/```\n/g, '')
            .replace(/```/g, '')
            .trim();
    }

    async function runASPQuery() {
        if (!inputData || inputData.length === 0) {
            Utils.snackbar(
                'No DTDL data available to run the query. Make sure to connect @DTDL/Parse output.'
            );
            return;
        }

        const res = [];
        for (const part of inputData) {
            try {
                // Build the program: DTDL facts + helper predicates + generated query
                let program =
                    part
                        .map((atom) => {
                            if (atom.predicate === options.predicate) {
                                return Base64.decode(atom.terms[0].string);
                            }
                            return atom.str + '.';
                        })
                        .join('\n') +
                    '\n' +
                    queryProgram +
                    '\n' +
                    generatedASP;

                const models = await Utils.search_models(program, 10, false);
                models.forEach((model) => {
                    const atoms = Utils.parse_atoms(model);
                    res.push(...atoms);
                });
            } catch (error) {
                throw new Error(`ASP execution error: ${error.message}`);
            }
        }

        queryResults = res.filter((atom) => atom.predicate !== '__error__');
    }

    async function generateNaturalLanguageAnswer() {
        if (
            !actual_config ||
            !actual_config.api_key ||
            !actual_config.api_key ||
            !actual_config.api_key.startsWith('sk-')
        ) {
            Utils.snackbar(
                'Please enter your OpenRouter API key to generate natural language answers. Get it for free at https://openrouter.ai/'
            );

            return;
        }

        const chat = new ChatOpenAI({
            model: actual_config.model || default_config.model,
            temperature: 0.3, // Slightly higher for more natural responses
            streamUsage: actual_config.streamUsage || default_config.streamUsage || false,
            apiKey: actual_config.api_key,
            configuration: {
                baseURL:
                    (actual_config.server || default_config.baseURL) +
                    (actual_config.endpoint || '')
            }
        });

        const resultsText = queryResults.map((atom) => atom.str).join('\n');

        const response = await chat.invoke([
            new SystemMessage(
                'You are a helpful assistant that explains DTDL query results in natural language. Be concise and clear.'
            ),
            new HumanMessage(
                `User query: "${naturalLanguageQuery}"\n\nQuery results (ASP facts):\n${resultsText}\n\nPlease provide a clear, concise answer in natural language (max 150 words).`
            )
        ]);

        naturalLanguageAnswer = response.content.trim();
    }

    async function processInput() {
        // Extract LLM config from input
        if (!inputData || inputData.length === 0) {
            return;
        }

        let config_atoms = [];
        for (const r of inputData) {
            let rr = r.filter((a) => a.predicate === default_config.predicate_config);
            config_atoms.push(...rr);
        }

        for (const atom of config_atoms) {
            if (atom.terms[0].functor === 'server_type') {
                actual_config.server_type = LLMs.decode_string(atom.terms[1].string);
            } else if (atom.terms[0].functor === 'server') {
                actual_config.server = LLMs.decode_string(atom.terms[1].string);
            } else if (atom.terms[0].functor === 'endpoint') {
                actual_config.endpoint = LLMs.decode_string(atom.terms[1].string);
            } else if (atom.terms[0].functor === 'model') {
                actual_config.model = LLMs.decode_string(atom.terms[1].string);
            } else if (atom.terms[0].functor === 'temperature') {
                actual_config.temperature = LLMs.decode_string(atom.terms[1].string);
            } else {
                Utils.snackbar(
                    `@LLMs/Chat Completion: Cannot interpret configuration atom ${atom.str}`
                );
            }
        }
        if (!actual_config.server) {
            Utils.snackbar(
                `No server specified in configuration. Using default server ${default_config.baseURL}`
            );
            actual_config.server = default_config.baseURL;
        }
        try {
            actual_config.api_key = await LLMs.access_api_key(actual_config.server);
        } catch (error) {
            Utils.snackbar(
                `Failed to access API key for server ${actual_config.server}. Please make sure you have set it up correctly.`
            );
        }
    }

    function downloadJSON() {
        const data = {
            query: naturalLanguageQuery,
            generated_asp: generatedASP,
            results: queryResults.map((a) => a.str),
            answer: naturalLanguageAnswer
        };
        Utils.download(data, 'dtdl-query-results.json');
    }

    function downloadYAML() {
        const data = {
            query: naturalLanguageQuery,
            generated_asp: generatedASP,
            results: queryResults.map((a) => a.str),
            answer: naturalLanguageAnswer
        };
        const yamlContent = yaml.dump(data);
        Utils.download(yamlContent, 'dtdl-query-results.yaml');
    }

    onMount(async () => {
        await processInput();
    });

    $: if (inputData) {
        processInput();
    }
</script>

<div class="container-fluid my-3">
    <div class="card">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
                <i class="bi bi-search"></i>
                DTDL Query - Natural Language to ASP
            </h5>
        </div>
        <div class="card-body">
            <!-- API Key Configuration -->
            <Alert color="info" class="mb-3">
                <strong>Configuration:</strong> Make sure to add an
                <strong>@LLMs/Config</strong> ingredient before this one to configure your API key.
                <br />
                Get a free OpenRouter API key at
                <a href="https://openrouter.ai/" target="_blank">https://openrouter.ai/</a>
            </Alert>

            <!-- Example Queries -->
            <div class="mb-3">
                <div class="form-label fw-bold">Example Queries:</div>
                <div class="d-flex flex-wrap gap-2">
                    {#each exampleQueries as example}
                        <Button
                            size="sm"
                            color="secondary"
                            outline
                            on:click={() => useExampleQuery(example)}
                        >
                            {example}
                        </Button>
                    {/each}
                </div>
            </div>

            <!-- Natural Language Query Input -->
            <InputGroup class="mb-3">
                <InputGroupText style="width: 8em;">Your Query</InputGroupText>
                <Input
                    type="textarea"
                    bind:value={naturalLanguageQuery}
                    placeholder="Ask a question about your DTDL model in natural language..."
                    rows="3"
                    disabled={isProcessing}
                />
            </InputGroup>

            <!-- Execute Button -->
            <div class="mb-3">
                <ButtonGroup>
                    <Button color="primary" on:click={executeQuery} disabled={isProcessing}>
                        {#if isProcessing}
                            <Spinner size="sm" />
                            Processing...
                        {:else}
                            <i class="bi bi-play-fill"></i>
                            Execute Query
                        {/if}
                    </Button>
                    {#if queryResults.length > 0}
                        <Button color="success" outline on:click={downloadJSON}>
                            <i class="bi bi-download"></i>
                            JSON
                        </Button>
                        <Button color="success" outline on:click={downloadYAML}>
                            <i class="bi bi-download"></i>
                            YAML
                        </Button>
                    {/if}
                </ButtonGroup>
            </div>

            <!-- Results Section -->
            {#if generatedASP}
                <div class="mb-3">
                    <h6 class="fw-bold">Generated ASP Code:</h6>
                    <pre class="bg-light p-3 rounded"><code>{generatedASP}</code></pre>
                </div>
            {/if}

            {#if naturalLanguageAnswer}
                <Alert color="success">
                    <h6 class="fw-bold">Answer:</h6>
                    <p class="mb-0">{naturalLanguageAnswer}</p>
                </Alert>
            {/if}

            {#if queryResults.length > 0}
                <div class="mb-3">
                    <h6 class="fw-bold">Query Results ({queryResults.length} facts):</h6>
                    <div
                        class="result-box bg-light p-3 rounded"
                        style="max-height: 400px; overflow-y: auto;"
                    >
                        {#each queryResults as atom}
                            <div class="result-item mb-1">
                                <code>{atom.str}</code>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if generatedASP && !isProcessing}
                <Alert color="warning">No results found for this query.</Alert>
            {/if}
        </div>
    </div>
</div>

<style>
    .result-item {
        font-family: monospace;
        font-size: 0.9em;
        border-left: 3px solid #007bff;
        padding-left: 0.5em;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
    }
</style>
