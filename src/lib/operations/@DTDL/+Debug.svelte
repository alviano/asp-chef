<script>
    import {
        Button,
        ButtonGroup,
        InputGroup,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from '@sveltestrap/sveltestrap';
    import { onMount } from 'svelte';
    import { Base64 } from 'js-base64';
    import { Utils } from '$lib/utils.js';
    import { Recipe } from '$lib/recipe';
    import { LLMs } from '$lib/operations/@LLMs/llms';
    import { ChatOpenAI } from '@langchain/openai';
    import { HumanMessage, SystemMessage } from '@langchain/core/messages';
    import debugProgram from '$lib/operations/@DTDL/res/debug.lp?raw';
    import Popover from '$lib/Popover.svelte';

    export let inputData;
    export let options;
    export let index;

    let debugData = null;
    let suggestedFixesData = {};

    let default_config = {
        model: 'qwen/qwen2.5-coder-7b-instruct',
        temperature: 0,
        streamUsage: false,
        apiKey: '',
        baseURL: 'https://openrouter.ai/api/v1',
        predicate_config: '__llms_config__'
    };

    let actual_config = {};

    const previewLimit = 100;
    let previewModalOpen = false;
    let previewModalContent = '';

    function togglePreviewModal() {
        previewModalOpen = !previewModalOpen;
    }

    function openPreviewModal(content) {
        previewModalContent = content || '';
        previewModalOpen = true;
    }

    function previewText(content) {
        if (!content) {
            return '';
        }
        if (content.length <= previewLimit) {
            return content;
        }
        return content.slice(0, previewLimit) + '...';
    }

    async function tryToFixWithLLM(i) {
        if (!debugData || !debugData.errors || !debugData.errors[i]) {
            Utils.snackbar('[DTDL/Debug] No error information available for this item.');
            return;
        }

        if (!actual_config.api_key || !actual_config.api_key.startsWith('sk-')) {
            Utils.snackbar(
                '[DTDL/Debug] Please enter your OpenRouter API key to get suggestions for fixing the error.\nGet it for free at https://openrouter.ai/'
            );
            return;
        }

        suggestedFixesData = {
            ...suggestedFixesData,
            [i]: `Generating suggestion...`
        };

        const chat = new ChatOpenAI({
            model: actual_config.model || default_config.model,
            temperature: parseFloat(actual_config.temperature || default_config.temperature || 0),
            streamUsage: actual_config.streamUsage || default_config.streamUsage || false,
            apiKey: actual_config.api_key,
            configuration: {
                baseURL: actual_config.server || default_config.baseURL
            }
        });

        let error = debugData.errors[i];
        let atom = debugData.rawAtoms[i];

        let structuredContext = '';
        if (atom) {
            const key = atom.terms[0].string;
            const t = atom.terms;
            const iface = t[1]?.string ?? '';
            const arg2 = t[2]?.string ?? '';
            const arg3 = t[3]?.string ?? '';
            const problems = {
                undefined_target:
                    `Diagnostic: undefined_target\nRelationship ID: ${iface}\nReferenced target interface: ${arg2}\nProblem: the target interface is not defined in the model.`,
                missing_required_property:
                    `Diagnostic: missing_required_property\nInterface ID: ${iface}\nMissing property name: ${arg2}\nProblem: the interface lacks a required property declared by domain constraints.`,
                extends_undefined:
                    `Diagnostic: extends_undefined\nInterface ID: ${iface}\nMissing parent interface: ${arg2}\nProblem: the interface extends an interface not defined in this model.`,
                duplicate_property_name:
                    `Diagnostic: duplicate_property_name\nInterface ID: ${iface}\nDuplicate name: ${arg2}\nProblem: DTDL requires all contents names to be unique within an interface.`,
                duplicate_telemetry_name:
                    `Diagnostic: duplicate_telemetry_name\nInterface ID: ${iface}\nDuplicate name: ${arg2}\nProblem: DTDL requires all contents names to be unique within an interface.`,
                duplicate_relationship_name:
                    `Diagnostic: duplicate_relationship_name\nInterface ID: ${iface}\nDuplicate name: ${arg2}\nProblem: DTDL requires all contents names to be unique within an interface.`,
                duplicate_command_name:
                    `Diagnostic: duplicate_command_name\nInterface ID: ${iface}\nDuplicate name: ${arg2}\nProblem: DTDL requires all contents names to be unique within an interface.`,
                ambiguous_name:
                    `Diagnostic: ambiguous_name\nInterface ID: ${iface}\nAmbiguous name: ${arg2}\nProblem: the same name is used by both a property and a telemetry element.`,
                ambiguous_name_rel:
                    `Diagnostic: ambiguous_name_rel\nInterface ID: ${iface}\nAmbiguous name: ${arg2}\nProblem: the same name is used by a relationship and another contents element.`,
                ambiguous_name_cmd:
                    `Diagnostic: ambiguous_name_cmd\nInterface ID: ${iface}\nAmbiguous name: ${arg2}\nProblem: the same name is used by a command and another contents element.`,
                self_referencing_relationship:
                    `Diagnostic: self_referencing_relationship\nInterface ID: ${iface}\nRelationship name: ${arg2}\nProblem: the relationship target points to the same interface that declares it.`,
                component_schema_undefined:
                    `Diagnostic: component_schema_undefined\nInterface ID: ${iface}\nComponent name: ${arg2}\nProblem: the component schema does not reference a defined Interface.`,
                component_self_reference:
                    `Diagnostic: component_self_reference\nInterface ID: ${iface}\nComponent name: ${arg2}\nProblem: the component schema references the containing interface itself.`,
                inherited_name_conflict:
                    `Diagnostic: inherited_name_conflict\nInterface ID: ${iface}\nConflicting name: ${arg2}\nProblem: an element name in this interface shadows an inherited element with the same name.`,
                circular_extends:
                    `Diagnostic: circular_extends\nInterface ID: ${iface}\nProblem: the interface is part of a cyclic extends chain, which DTDL forbids.`,
                deep_extends_chain:
                    `Diagnostic: deep_extends_chain\nInterface ID: ${iface}\nProblem: the extends chain exceeds 3 levels of inheritance. Consider flattening the hierarchy.`,
                property_schema_undefined:
                    `Diagnostic: property_schema_undefined\nInterface ID: ${iface}\nProperty name: ${arg2}\nProblem: the property schema is not a primitive type, enum, object, array, map, or known interface.`,
                enum_no_values:
                    `Diagnostic: enum_no_values\nInterface ID: ${iface}\nElement name: ${arg2}\nProblem: the Enum schema has no enumValues defined.`,
                object_no_fields:
                    `Diagnostic: object_no_fields\nInterface ID: ${iface}\nElement name: ${arg2}\nProblem: the Object schema has no fields defined.`,
                isolated_interface:
                    `Diagnostic: isolated_interface\nInterface ID: ${iface}\nProblem: this interface is not referenced by any other interface (no target, extends, or component schema points to it).`,
                command_request_schema_undefined:
                    `Diagnostic: command_request_schema_undefined\nInterface ID: ${iface}\nCommand name: ${arg2}\nProblem: the command request schema is not a known type.`,
                command_response_schema_undefined:
                    `Diagnostic: command_response_schema_undefined\nInterface ID: ${iface}\nCommand name: ${arg2}\nProblem: the command response schema is not a known type.`,
                max_multiplicity_exceeded:
                    `Diagnostic: max_multiplicity_exceeded\nRelationship ID: ${iface}\nCount: ${arg2}, Maximum: ${arg3}\nProblem: the relationship has more instances than its maxMultiplicity allows.`
            };
            structuredContext = problems[key] ?? `Diagnostic: ${key}\nRaw atom: ${atom.str}`;
        }

        const response = await chat.invoke([
            new SystemMessage(
                'You are an expert in DTDL (Digital Twins Definition Language) v4. ' +
                    'You receive structured diagnostic information from a symbolic ASP-based validator. ' +
                    'Explain the root cause of the error and suggest a concrete, actionable fix ' +
                    'including the corrected DTDL JSON-LD snippet. ' +
                    'Do not invent properties or fields not defined in the DTDL v4 specification. ' +
                    'Be concise: max 200 words.'
            ),
            new HumanMessage(structuredContext || error)
        ]);

        suggestedFixesData = {
            ...suggestedFixesData,
            [i]: `${response.content}`
        };
    }

    async function processInput() {
        if (!inputData || inputData.length === 0) {
            debugData = null;
            return;
        }

        const debugPredicate = debugProgram;
        const res = [];
        for (const part of inputData) {
            try {
                let program =
                    part
                        .map((atom) => {
                            if (atom.predicate === options.predicate) {
                                return (
                                    Base64.decode(atom.terms[0].string) +
                                    (options.echo_encoded_content ? '\n' + atom.str + '.' : '')
                                );
                            }
                            return atom.str + '.';
                        })
                        .join('\n') +
                    '\n' +
                    debugPredicate;
                const models = await Utils.search_models(program, 1, false);
                models.forEach((model) => {
                    res.push(Utils.parse_atoms(model));
                });
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }

        let debug_atoms = [];
        for (const r of res) {
            let rr = r.filter((a) => a.predicate === '__debug__');
            debug_atoms.push(...rr);
        }

        let config_atoms = [];
        for (const r of res) {
            let rr = r.filter((a) => a.predicate === default_config.predicate_config);
            config_atoms.push(...rr);
        }

        if (config_atoms.length === 0) {
            Utils.snackbar(`[DTDL/Debug] No LLM configuration found. Using default configuration.`);
            actual_config = { ...default_config };
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
                Utils.snackbar(`[DTDL/Debug] Cannot interpret configuration atom ${atom.str}`);
            }
        }
        if (!actual_config.server) {
            Utils.snackbar(
                `[DTDL/Debug] No server specified in configuration. Using default server ${default_config.baseURL}`
            );
            actual_config.server = default_config.baseURL;
        }
        try {
            actual_config.api_key = await LLMs.access_api_key(actual_config.server);
            if (!actual_config.api_key) {
                Utils.snackbar(
                    `[DTDL/Debug] No API key found for ${actual_config.server}. Register one with @LLMs/Register API Key.`
                );
            }
        } catch (error) {
            Utils.snackbar(
                `[DTDL/Debug] Failed to access API key for server ${actual_config.server}. Please make sure you have set it up correctly.`
            );
        }

        let errors = [];
        let rawAtoms = [];

        function termStr(term) {
            if (!term) return '';
            if (term.type === 'string' || typeof term.string === 'string') return term.string;
            // compound: extract last string argument
            if (term.args || term.arguments) {
                const args = term.args || term.arguments;
                for (let i = args.length - 1; i >= 0; i--) {
                    if (typeof args[i].string === 'string') return args[i].string;
                }
            }
            return term.str ?? String(term);
        }

        for (const atom of debug_atoms) {
            let template_key = atom.terms[0].string;
            let rel, target, count, max, overflow, dtdl_interface, prop;

            let rel2, parent, name, comp;
            switch (template_key) {
                case 'undefined_target':
                    rel = termStr(atom.terms[1]);
                    target = atom.terms[2].string;
                    break;
                case 'max_multiplicity_exceeded':
                    rel = atom.terms[1].string;
                    count = atom.terms[2].string;
                    max = atom.terms[3].string;
                    overflow = count - max;
                    break;
                case 'missing_required_property':
                    dtdl_interface = atom.terms[1].string;
                    prop = atom.terms[2].string;
                    break;
                case 'extends_undefined':
                    dtdl_interface = atom.terms[1].string;
                    parent = atom.terms[2].string;
                    break;
                case 'duplicate_property_name':
                case 'duplicate_telemetry_name':
                case 'duplicate_relationship_name':
                case 'duplicate_command_name':
                case 'ambiguous_name':
                case 'ambiguous_name_rel':
                case 'ambiguous_name_cmd':
                case 'inherited_name_conflict':
                case 'property_schema_undefined':
                case 'enum_no_values':
                case 'object_no_fields':
                case 'command_request_schema_undefined':
                case 'command_response_schema_undefined':
                    dtdl_interface = atom.terms[1].string;
                    name = atom.terms[2].string;
                    break;
                case 'self_referencing_relationship':
                    dtdl_interface = atom.terms[1].string;
                    rel = atom.terms[2].string;
                    break;
                case 'component_schema_undefined':
                case 'component_self_reference':
                    dtdl_interface = atom.terms[1].string;
                    comp = atom.terms[2].string;
                    break;
                case 'circular_extends':
                case 'deep_extends_chain':
                case 'isolated_interface':
                    dtdl_interface = atom.terms[1].string;
                    break;
            }

            const error_templates = {
                undefined_target: `ERROR: Relationship '${termStr(atom.terms[1])}' references undefined interface '${target}'\nCheck DTDL model or add missing interface definition`,
                max_multiplicity_exceeded: `ERROR: Relationship '${rel}' exceeds maximum multiplicity\nCurrent: ${count}, Maximum: ${max}\nRemove ${overflow} instances`,
                missing_required_property: `ERROR: Interface '${dtdl_interface}' missing required property '${prop}'\nAdd property definition or mark as optional`,
                extends_undefined: `ERROR: Interface '${dtdl_interface}' extends undefined interface '${parent}'\nAdd the missing interface definition or fix the @id reference`,
                duplicate_property_name: `ERROR: Interface '${dtdl_interface}' has duplicate property name '${name}'\nDTDL contents names must be unique within an interface`,
                duplicate_telemetry_name: `ERROR: Interface '${dtdl_interface}' has duplicate telemetry name '${name}'\nDTDL contents names must be unique within an interface`,
                duplicate_relationship_name: `ERROR: Interface '${dtdl_interface}' has duplicate relationship name '${name}'\nDTDL contents names must be unique within an interface`,
                duplicate_command_name: `ERROR: Interface '${dtdl_interface}' has duplicate command name '${name}'\nDTDL contents names must be unique within an interface`,
                ambiguous_name: `ERROR: Interface '${dtdl_interface}' has ambiguous name '${name}' used by both a property and a telemetry\nDTDL contents names must be unique across all element types`,
                ambiguous_name_rel: `ERROR: Interface '${dtdl_interface}' has ambiguous name '${name}' used by a relationship and another element\nDTDL contents names must be unique across all element types`,
                ambiguous_name_cmd: `ERROR: Interface '${dtdl_interface}' has ambiguous name '${name}' used by a command and another element\nDTDL contents names must be unique across all element types`,
                self_referencing_relationship: `ERROR: Interface '${dtdl_interface}' has relationship '${rel}' targeting itself\nSelf-referencing relationships are almost always a modelling mistake`,
                component_schema_undefined: `ERROR: Interface '${dtdl_interface}' has component '${comp}' with undefined schema\nThe component schema must reference a defined Interface`,
                component_self_reference: `ERROR: Interface '${dtdl_interface}' has component '${comp}' whose schema references the same interface\nA component cannot contain itself`,
                inherited_name_conflict: `ERROR: Interface '${dtdl_interface}' has element '${name}' that conflicts with an inherited element of the same name\nRename or remove the overriding definition`,
                circular_extends: `ERROR: Interface '${dtdl_interface}' is part of a circular extends chain\nDTDL does not allow cyclic inheritance`,
                deep_extends_chain: `ERROR: Interface '${dtdl_interface}' has an extends chain deeper than 3 levels\nConsider flattening the hierarchy`,
                property_schema_undefined: `ERROR: Interface '${dtdl_interface}' property '${name}' references an undefined schema\nUse a primitive type or a defined complex schema`,
                enum_no_values: `ERROR: Interface '${dtdl_interface}' element '${name}' has an Enum schema with no enumValues\nAdd at least one enumValue`,
                object_no_fields: `ERROR: Interface '${dtdl_interface}' element '${name}' has an Object schema with no fields\nAdd at least one field`,
                isolated_interface: `WARNING: Interface '${dtdl_interface}' is not referenced by any other interface\nConsider whether this interface is intentionally standalone`,
                command_request_schema_undefined: `ERROR: Interface '${dtdl_interface}' command '${name}' request references an undefined schema\nUse a primitive type or a defined complex schema`,
                command_response_schema_undefined: `ERROR: Interface '${dtdl_interface}' command '${name}' response references an undefined schema\nUse a primitive type or a defined complex schema`
            };
            errors.push(
                error_templates[template_key] ??
                    `ERROR: ${template_key} on ${atom.terms[1]?.string}`
            );
            rawAtoms.push(atom);
        }

        debugData = {
            status: errors.length > 0 ? 'FAILED' : 'VALID',
            count: errors.length,
            errors,
            rawAtoms
        };
    }

    onMount(() => {
        processInput();
    });

    $: if (inputData) {
        processInput();
    }
</script>

<div class="alert alert-info d-flex align-items-center mb-3 py-2" role="alert">
    <i class="bi bi-robot me-2" style="font-size: 1.5em;"></i>
    <div class="flex-grow-1">
        <strong>AI-Assisted Debugging</strong> — Uses OpenRouter for automatic fix suggestions
    </div>
    <Popover
        title="Configuration Required"
        value="Register your OpenRouter API key using @LLMs/Register API Key operation. Get a free key at openrouter.ai. You can customize model and temperature using @LLMs/Config before this operation."
        placement="left"
    >
        <Button color="link" size="sm" class="p-1">
            <i class="bi bi-question-circle" style="font-size: 1.2em;"></i>
        </Button>
    </Popover>
</div>

<InputGroup class="m-2 justify-content-end">
    <Popover
        title="Debug information"
        value="Download the debug information as JSON. The debug information includes the list of errors found in the DTDL model"
    >
        <Button class="m-1" on:click={() => Utils.download(debugData, 'debug_errors.json')}
            ><i class="bi bi-download"></i> <span>Error Json</span></Button
        >
    </Popover>
    <Popover
        title="Debug information"
        value="Download the debug information as YAML file. The debug information includes the list of errors found in the DTDL model"
    >
        <Button class="m-1" on:click={() => Utils.download(debugData, 'debug_errors.yaml')}
            ><i class="bi bi-download"></i> <span>Error Yaml</span></Button
        >
    </Popover>
    <Popover
        title="Suggested fixes"
        value="Download the suggested fixes for the errors as JSON. The suggestions are
generated by an AI model based on the error messages and may help to resolve the issues in the DTDL model."
    >
        <Button class="m-1" on:click={() => Utils.download(suggestedFixesData, 'fix.json')}
            ><i class="bi bi-download"></i> <span>Suggestion Json</span></Button
        >
    </Popover>
    <Popover
        title="Suggested fixes"
        value="Download the suggested fixes for the errors as YAML file. The suggestions are
generated by an AI model based on the error messages and may help to resolve the issues in the DTDL model."
    >
        <Button class="m-1" on:click={() => Utils.download(suggestedFixesData, 'fix.yaml')}
            ><i class="bi bi-download"></i> <span>Suggestion Yaml</span></Button
        >
    </Popover>
</InputGroup>
<div class="p-2 output" data-testid="Markdown-output">
    {#if debugData === null}
        <em>No debug information</em>
    {:else}
        <div
            class="status-banner mb-2 p-2 text-center fw-bold"
            class:status-valid={debugData.status === 'VALID'}
            class:status-failed={debugData.status === 'FAILED'}
        >
            {debugData.status} — {debugData.count} error{debugData.count !== 1 ? 's' : ''} found
        </div>

        {#if debugData.errors.length > 0}
            {#each debugData.errors as err, i}
                <div class="error-item mb-1">
                    {#each err.split('\n') as line, j}
                        {#if j === 0}
                            <div class="error-row {suggestedFixesData[i] ? 'has-suggestion' : ''}">
                                <div class="error-col error-col-main">
                                    <div class="fw-bold">{line}</div>
                                </div>
                                {#if suggestedFixesData[i]}
                                    <div class="error-col error-col-suggestion">
                                        {@html Utils.render_markdown(
                                            previewText(suggestedFixesData[i])
                                        )}
                                        {#if suggestedFixesData[i] && suggestedFixesData[i].length > previewLimit}
                                            <Button
                                                class="p-0 mt-1"
                                                color="link"
                                                on:click={() =>
                                                    openPreviewModal(suggestedFixesData[i])}
                                            >
                                                Read more
                                            </Button>
                                        {/if}
                                    </div>
                                {/if}
                                <div class="error-col error-col-action">
                                    <ButtonGroup>
                                        <Popover
                                            title="Try to fix with AI"
                                            value="Get a suggestion for fixing this error using an AI model (Qwen 2.5 Coder). Requires OperRouter API key."
                                        >
                                            <Button size="sm" on:click={() => tryToFixWithLLM(i)}>
                                                <i class="fas fa-robot"></i>
                                            </Button>
                                        </Popover>
                                    </ButtonGroup>
                                </div>
                            </div>
                        {:else}
                            <div class="text-muted" style="font-size: 0.85em;">{line}</div>
                        {/if}
                    {/each}
                </div>
            {/each}
        {/if}
    {/if}
</div>

<Modal isOpen={previewModalOpen} toggle={togglePreviewModal} size="lg">
    <ModalHeader toggle={togglePreviewModal}>Suggested Fix</ModalHeader>
    <ModalBody>
        {#if previewModalContent}
            {@html Utils.render_markdown(previewModalContent)}
        {:else}
            <em>No content</em>
        {/if}
    </ModalBody>
    <ModalFooter>
        <Button color="primary" on:click={togglePreviewModal}>Close</Button>
    </ModalFooter>
</Modal>

<style>
    .status-banner {
        border: 2px solid;
        font-size: 0.9em;
    }
    .status-valid {
        border-color: #198754;
        background: #d1e7dd;
        color: #0f5132;
    }
    .status-failed {
        border-color: #dc3545;
        background: #f8d7da;
        color: #842029;
    }
    .error-item {
        padding: 0.4em 0.6em;
        border-left: 3px solid #dc3545;
        background: #fff5f5;
        font-size: 0.85em;
    }
    .error-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(9rem, 5%);
        align-items: start;
        gap: 0.5rem;
    }
    .error-row.has-suggestion {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(9rem, 5%);
    }
    .error-col-action :global(.input-group) {
        justify-content: flex-end;
    }
    .error-col-action :global(.btn) {
        width: 100%;
        max-width: 100%;
    }

    .error-col-action {
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }
</style>
