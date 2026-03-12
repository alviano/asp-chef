<script>
    import { DTDL } from '$lib/operations/@DTDL/dtdl.js';
    import { LLMs } from '$lib/operations/@LLMs/llms';
    import { Utils } from '$lib/utils.js';
    import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenRouter } from "@langchain/openrouter";    
import {
        Alert,
        Button,
        ButtonGroup,
        Card,
        CardBody,
        CardTitle,
        Input,
        Label,
        Nav,
        NavItem,
        NavLink,
        Spinner
    } from '@sveltestrap/sveltestrap';
    import { Base64 } from 'js-base64';
    import { onMount } from 'svelte';
    export let id;
    export let inputData;
    export let options;
    export let index;

    let isProcessing = false;
    let activeTab = 'llm';

    // LLM mode
    let textualDescription = '';
    let generatedDTDL = '';
    let generatedJSON = null;
    let validationResult = null;
    let aspConstraints = '';
    let qualityScore = null;
    let rawLLMOutput = ''; // Raw output from LLM for debugging

    // Template mode
    let selectedTemplate = 'sensor';
    let templateParams = {
        name: '',
        namespace: 'custom',
        telemetries: [],
        properties: [],
        commands: []
    };

    // Schema mode
    let jsonSchemaInput = '';

    let default_config = {
        model: 'qwen/qwen2.5-coder-7b-instruct',
        temperature: 0,
        stream_usage: false,
        api_key: '',
        base_url: 'https://openrouter.ai/api/v1',
        predicate_config: '__llms_config__'
    };

    let actual_config = {};

    // Templates disponibili
    const templates = {
        sensor: {
            name: 'Sensor',
            description: 'Generic sensor with telemetry',
            defaults: {
                telemetries: [{ name: 'value', schema: 'double' }]
            }
        },
        actuator: {
            name: 'Actuator',
            description: 'Device that performs actions',
            defaults: {
                commands: [{ name: 'execute' }],
                properties: [{ name: 'state', schema: 'string', writable: true }]
            }
        },
        controller: {
            name: 'Controller',
            description: 'Orchestration device',
            defaults: {
                properties: [{ name: 'status', schema: 'string' }]
            }
        }
    };

    // Example descriptions
    const exampleDescriptions = [
        'Create a temperature and humidity sensor with telemetry every 5 minutes and a calibration command',
        'Crea un sensore di umidità del suolo con telemetria per umidità, temperatura e pH',
        'Build a smart valve actuator with open/close commands and position feedback',
        'Crea un controller che monitora 3 sensori di temperatura e può inviare comandi di calibrazione'
    ];

    onMount(() => {
        //  loadLLMConfig();
    });

    async function loadLLMConfig() {
        if (!inputData || inputData.length === 0) return;

        actual_config = { ...default_config };

        for (const model of inputData) {
            for (const atom of model) {
                if (atom.predicate !== default_config.predicate_config) continue;

                if (atom.terms[0].functor === 'server_type') {
                    actual_config.server_type = LLMs.decode_string(atom.terms[1].string);
                } else if (atom.terms[0].functor === 'server') {
                    actual_config.server = LLMs.decode_string(atom.terms[1].string);
                } else if (atom.terms[0].functor === 'endpoint') {
                    actual_config.endpoint = LLMs.decode_string(atom.terms[1].string);
                } else if (atom.terms[0].functor === 'model') {
                    actual_config.model = LLMs.decode_string(atom.terms[1].string);
                } else if (atom.terms[0].functor === 'temperature') {
                    actual_config.temperature = parseFloat(LLMs.decode_string(atom.terms[1].string));
                } else {
                    Utils.snackbar(
                        `[DTDL/Generate] Cannot interpret configuration atom ${atom.str}`
                    );
                }
            }
        }

        if (!actual_config.server) {
            Utils.snackbar(
                `[DTDL/Generate] No server specified in configuration. Using default server ${default_config.base_url}`
            );
            actual_config.server = default_config.base_url;
        }

        try {
            actual_config.api_key = await LLMs.access_api_key(actual_config.server);
        } catch (error) {
            Utils.snackbar(
                `[DTDL/Generate] Failed to access API key for server ${actual_config.server}. Please make sure you have set it up correctly.`
            );
        }
    }

    function useExampleDescription(desc) {
        textualDescription = desc;
    }

    function cleanLLMResponse(content) {
        // Remove special tokens that code completion models add
        return content
            .replace(/<\|fim_suffix\|>/g, '')
            .replace(/<\|fim_middle\|>/g, '')
            .replace(/<\|fim_prefix\|>/g, '')
            .replace(/<\|file_sep\|>/g, '')
            .replace(/<\|end\|>/g, '')
            .replace(/<\|[^>]+\|>/g, '') // Remove any other special tokens
            .trim();
    }

    function extractJSON(content) {
        // Clean the content first
        const cleanedContent = cleanLLMResponse(content);

        // console.log('Cleaned content:', cleanedContent);

        // If the cleaned payload is already JSON, keep it intact.
        if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
            return cleanedContent;
        }

        // Try markdown code block first
        const codeBlockMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }

        // Try plain code block
        const plainCodeBlock = cleanedContent.match(/```\s*([\s\S]*?)\s*```/);
        if (plainCodeBlock) {
            return plainCodeBlock[1].trim();
        }

        // Prefer a full JSON object before extracting nested arrays.
        const objectMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            return objectMatch[0];
        }

        const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            return arrayMatch[0];
        }

        return null;
    }

    async function generateFromLLM() {
        await loadLLMConfig();
        if (!textualDescription.trim()) {
            Utils.snackbar('[DTDL/Generate] Please enter a description.');
            return;
        }

        if (!actual_config.api_key || !actual_config.api_key.startsWith('sk-')) {
            Utils.snackbar(
                '[DTDL/Generate] Please configure LLM API key using @LLMs/Config first.'
            );
            return;
        }
        isProcessing = true;
        generatedDTDL = '';
        generatedJSON = null;
        validationResult = null;
        aspConstraints = '';
        qualityScore = null;
        rawLLMOutput = '';

        try {
            // Phase 1: LLM Entity Extraction
            const extractionResult = await extractEntities(textualDescription);

            // Phase 2: ASP Constraint Validation
            const constraints = await validateWithASP(extractionResult);
            aspConstraints = constraints;

            // Phase 3: LLM JSON Generation
            const dtdlJSON = await generateDTDLJSON(extractionResult, constraints);
            generatedJSON = dtdlJSON;
            generatedDTDL = JSON.stringify(dtdlJSON, null, 2);

            // Phase 4: Validation
            await validateDTDL(generatedDTDL);

            // Phase 5: Quality Check with ASP
            await checkQuality(generatedDTDL);

            Utils.snackbar('[DTDL/Generate] DTDL generated successfully!', 'success');
        } catch (error) {
            Utils.snackbar(`[DTDL/Generate] Generation error: ${error.message}`);
            // console.error(error);
            validationResult = { valid: false, error: error.message };
        } finally {
            isProcessing = false;
        }
    }

    async function extractEntities(description) {
        const llm = new ChatOpenRouter(actual_config.model, {
            temperature: actual_config.temperature || 0,
            apiKey: actual_config.api_key,
            streamUsage: actual_config.stream_usage || false,
        });

        const systemPrompt = `You are a DTDL (Digital Twin Definition Language) expert.
Extract structured information from natural language descriptions.

Output a JSON object with this structure:
{
  "interfaces": [
    {
      "name": "InterfaceName",
      "type": "sensor|actuator|controller",
      "displayName": "Human readable name",
      "description": "Description",
      "telemetries": [{"name": "telemetryName", "schema": "double|integer|string|boolean|dateTime"}],
      "properties": [{"name": "propName", "schema": "...", "writable": true|false}],
      "commands": [{"name": "commandName"}],
      "relationships": [{"name": "relName", "target": "TargetInterfaceName"}]
    }
  ]
}

Rules:
- Interface names must be PascalCase
- Telemetry/property/command names must be camelCase
- Schema types: double, integer, string, boolean, dateTime
- Temperature/humidity/pressure → double schema
- Counts → integer schema
- Text/status → string schema
- Flags → boolean schema

Extract only what is explicitly mentioned. Do not add extra features.`;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Extract DTDL structure from: ${description}`)
        ]);
        
        // console.log('Entity extraction response:', response.content);

        const jsonString = extractJSON(response.content);

        if (!jsonString) {
            Utils.snackbar(
                'LLM did not return valid JSON for entity extraction. Try using a chat model like "meta-llama/llama-3.1-8b-instruct" instead of a code completion model.'
            );
        }


        let extracted;
        try {
            extracted = Utils.parse_relaxed_json(jsonString);
        } catch (relaxedError) {
            try {
                extracted = JSON.parse(jsonString);
            } catch (parseError) {
                Utils.snackbar(`Failed to parse entity extraction JSON: ${parseError.message}`);
            }
        }

        if (Array.isArray(extracted)) {
            extracted = { interfaces: extracted };
        }

        if (!extracted || !Array.isArray(extracted.interfaces)) {
            Utils.snackbar('Entity extraction did not return an "interfaces" array.');
        }
        return extracted;
    }

    async function validateWithASP(extracted) {
        const aspProgram = generateConstraintProgram(extracted);

        try {
            const result = await Utils.search_model(aspProgram);
            if (!result.Result || result.Result === 'UNSATISFIABLE') {
                Utils.snackbar('Generated structure violates DTDL constraints');
            }
            const suggestions = result.Call?.[0]?.Witnesses?.[0]?.Value || [];
            return formatConstraintOutput(suggestions);
        } catch (error) {
            return 'No constraints applied';
        }
    }

    function generateConstraintProgram(extracted) {
        let program = '% Generated constraint program\n\n';

        // Dichiarazione interfacce
        extracted.interfaces.forEach((iface) => {
            program += `proposed_interface("${iface.name}", ${iface.type}).\n`;

            iface.telemetries?.forEach((tel) => {
                program += `proposed_telemetry("${iface.name}", "${tel.name}", "${tel.schema}").\n`;
            });

            iface.properties?.forEach((prop) => {
                program += `proposed_property("${iface.name}", "${prop.name}", "${prop.schema}").\n`;
                if (prop.writable) {
                    program += `proposed_writable("${iface.name}", "${prop.name}").\n`;
                }
            });

            iface.commands?.forEach((cmd) => {
                program += `proposed_command("${iface.name}", "${cmd.name}").\n`;
            });

            iface.relationships?.forEach((rel) => {
                program += `proposed_relationship("${iface.name}", "${rel.name}", "${rel.target}").\n`;
            });
        });

        // Constraint rules
        program += `
% Sensors devono avere almeno una telemetry
:- proposed_interface(I, sensor), not proposed_telemetry(I, _, _).

% Controllers dovrebbero avere relazioni
warning_no_relationships(I) :- proposed_interface(I, controller), not proposed_relationship(I, _, _).

% Suggersci telemetry standard
suggest_telemetry(I, "lastUpdateTime", "dateTime") :- proposed_interface(I, sensor).
suggest_telemetry(I, "status", "string") :- proposed_interface(I, _).

% Temperature dovrebbe avere unit
needs_unit(I, Tel) :- proposed_telemetry(I, Tel, "double"), Tel = "temperature".

% Relazioni devono puntare a interfacce esistenti
:- proposed_relationship(I1, _, I2), not proposed_interface(I2, _).

% Genera DTMI IDs
dtmi_id(I, ID) :-
	proposed_interface(I, Type),
	ID = @concat("dtmi:custom:", Type, ":", I, ";1").

#show suggest_telemetry/3.
#show needs_unit/2.
#show dtmi_id/2.
#show warning_no_relationships/1.
`;

        return program;
    }

    function formatConstraintOutput(suggestions) {
        if (!suggestions || suggestions.length === 0) return 'All constraints satisfied';

        return suggestions
            .map((atom) => {
                if (atom.startsWith('suggest_telemetry')) {
                    return `Consider adding telemetry: ${atom}`;
                }
                if (atom.startsWith('needs_unit')) {
                    return `Missing unit annotation: ${atom}`;
                }
                if (atom.startsWith('dtmi_id')) {
                    return `Generated ID: ${atom}`;
                }
                return atom;
            })
            .join('\n');
    }

    async function generateDTDLJSON(extracted, constraints) {
        const llm = new ChatOpenRouter(actual_config.model, {
            temperature: actual_config.temperature || 0,
            apiKey: actual_config.api_key,
            streamUsage: actual_config.stream_usage || false,
        });

        const systemPrompt = `You are a DTDL v4 code generator.
Generate valid DTDL JSON from structured specifications.

DTDL v4 Template:
{
  "@context": ["dtmi:dtdl:context;4"],
  "@id": "dtmi:namespace:InterfaceName;1",
  "@type": "Interface",
  "displayName": "Display Name",
  "description": "Description",
  "contents": [
    {
      "@type": "Telemetry",
      "name": "telemetryName",
      "schema": "double"
    },
    {
      "@type": "Property",
      "name": "propertyName",
      "schema": "string",
      "writable": true
    },
    {
      "@type": "Command",
      "name": "commandName"
    },
    {
      "@type": "Relationship",
      "name": "relationshipName",
      "target": "dtmi:namespace:TargetInterface;1"
    }
  ]
}

Rules:
- Always include @context with dtmi:dtdl:context;4
- @id must follow pattern: dtmi:namespace:InterfaceName;1
- All contents must have @type and name
- Schema types: double, integer, string, boolean, dateTime, duration, date, time
- For arrays: {"@type": "Array", "elementSchema": "double"}
- Commands can have request and response schemas
- Include displayName and description for clarity

Generate complete, valid DTDL. Return ONLY the JSON, no explanations.`;

        const userPrompt = `Generate DTDL JSON for:
${JSON.stringify(extracted, null, 2)}

Additional constraints to respect:
${constraints}`;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);
        // debugger
        // console.log('LLM Response:', response.content);

        // Store raw output for debugging
        rawLLMOutput =
            typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);

        const jsonString = extractJSON(
            typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content)
        );

        if (!jsonString) {

            Utils.snackbar(
                'LLM did not return valid JSON. Check the "Raw LLM Output" section below. Try using a chat model like "meta-llama/llama-3.1-8b-instruct" instead of a code completion model.'
            );
        }



        let dtdlJSON;
        try {

            dtdlJSON = Utils.parse_relaxed_json(jsonString);
        } catch (relaxedError) {

            try {
                dtdlJSON = JSON.parse(jsonString);
            } catch (parseError) {

                Utils.snackbar(`Failed to parse LLM JSON: ${parseError.message}`);
            }
        }

        // Handle array of interfaces
        if (!Array.isArray(dtdlJSON)) {
            return [dtdlJSON];
        }

        return dtdlJSON;
    }

    async function validateDTDL(dtdlString) {
        try {
            const dtdlObj = JSON.parse(dtdlString);

            // Basic validation - check required fields
            const interfaces = Array.isArray(dtdlObj) ? dtdlObj : [dtdlObj];

            for (const iface of interfaces) {
                if (!iface['@context']) {
                    Utils.snackbar('Missing @context field');
                }
                if (!iface['@id']) {
                    Utils.snackbar('Missing @id field');
                }
                if (!iface['@type']) {
                    Utils.snackbar('Missing @type field');
                }
                if (iface['@type'] !== 'Interface') {
                    Utils.snackbar(`Expected @type to be "Interface", got "${iface['@type']}"`);
                }
            }

            // Try parsing to validate with DTDL schema
            try {
                await DTDL.parser(dtdlString, '');
                validationResult = { valid: true };
            } catch (parseError) {
                // Parser error - show it but don't throw
                validationResult = {
                    valid: false,
                    error: parseError.message,
                    warning:
                        'DTDL structure is valid but schema validation failed. The model might still be usable.'
                };
            }
        } catch (error) {
            validationResult = { valid: false, error: error.message };
            throw error;
        }
    }

    async function checkQuality(dtdlString) {
        try {
            // Parse DTDL to ASP
            const aspFacts = await DTDL.parser(dtdlString, '');

            // Quality check program
            const qualityProgram = `
${aspFacts}

% Quality metrics
quality_issue("missing_displayName", I) :- interface(I), not displayName(I, _).
quality_issue("missing_description", I) :- interface(I), not description(I, _).

has_displayName(I) :- interface(I), displayName(I, _).
has_description(I) :- interface(I), description(I, _).

completeness_score(Score) :-
	#count{I : interface(I)} = Total,
	#count{I : has_displayName(I), has_description(I)} = Complete,
	Total > 0,
	Score = (Complete * 100) / Total.

#show quality_issue/2.
#show completeness_score/1.
`;

            const result = await Utils.search_models(qualityProgram, 1, false);
            const atoms = result.Call?.[0]?.Witnesses?.[0]?.Value || [];

            const scoreAtom = atoms.find((a) => a.startsWith('completeness_score'));
            if (scoreAtom) {
                const match = scoreAtom.match(/completeness_score\((\d+)\)/);
                if (match) {
                    qualityScore = parseInt(match[1]);
                }
            }
        } catch (error) {
            qualityScore = null;
        }
    }

    async function downloadDTDL() {
        if (!generatedDTDL) return;

        const blob = new Blob([generatedDTDL], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-dtdl.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function sendToPipeline() {
        if (!generatedDTDL) return;

        try {
            // Encode DTDL in base64 and add to pipeline
            const encoded = Base64.encode(generatedDTDL);
            const atom = Utils.parse_atom(`${options.predicate}("${encoded}")`);

            // Update recipe output at this operation's index
            Utils.to_index_map(atom, [['atom']], index);

            Utils.snackbar('[DTDL/Generate] DTDL sent to pipeline!', 'success');
        } catch (error) {
            Utils.snackbar(`[DTDL/Generate] Error sending to pipeline: ${error.message}`);
        }
    }

    async function generateFromTemplate() {
        if (!templateParams.name || templateParams.name.trim() === '') {
            Utils.snackbar('[DTDL/Generate] Please enter an interface name.');
            return;
        }

        isProcessing = true;
        generatedDTDL = '';
        generatedJSON = null;
        validationResult = null;

        try {
            // Build DTDL from template
            const contents = [];

            // Add telemetries
            for (const tel of templateParams.telemetries) {
                if (tel.name && tel.schema) {
                    contents.push({
                        '@type': 'Telemetry',
                        name: tel.name,
                        displayName: tel.displayName || tel.name,
                        schema: tel.schema,
                        ...(tel.unit && { unit: tel.unit })
                    });
                }
            }

            // Add properties
            for (const prop of templateParams.properties) {
                if (prop.name && prop.schema) {
                    contents.push({
                        '@type': 'Property',
                        name: prop.name,
                        displayName: prop.displayName || prop.name,
                        schema: prop.schema,
                        ...(prop.writable !== undefined && { writable: prop.writable })
                    });
                }
            }

            // Add commands
            for (const cmd of templateParams.commands) {
                if (cmd.name) {
                    contents.push({
                        '@type': 'Command',
                        name: cmd.name,
                        displayName: cmd.displayName || cmd.name
                    });
                }
            }

            const dtdl = {
                '@context': ['dtmi:dtdl:context;4'],
                '@id': `dtmi:${templateParams.namespace}:${templateParams.name};1`,
                '@type': 'Interface',
                displayName: templateParams.displayName || templateParams.name,
                description:
                    templateParams.description || `${templates[selectedTemplate].name} interface`,
                contents: contents
            };
            generatedJSON = [dtdl];
            generatedDTDL = JSON.stringify(dtdl, null, 2);
            await validateDTDL(generatedDTDL);
            await checkQuality(generatedDTDL);
            Utils.snackbar('[DTDL/Generate] DTDL generated from template!', 'success');
        } catch (error) {
            Utils.snackbar(`[DTDL/Generate] Generation error: ${error.message}`);

            validationResult = { valid: false, error: error.message };
        } finally {
            isProcessing = false;
        }
    }

    async function generateFromSchema() {
        if (!jsonSchemaInput || jsonSchemaInput.trim() === '') {
            Utils.snackbar('[DTDL/Generate] Please enter a JSON Schema.');
            return;
        }

        isProcessing = true;
        generatedDTDL = '';
        generatedJSON = null;
        validationResult = null;

        try {
            // Parse JSON Schema
            const schema = JSON.parse(jsonSchemaInput);

            if (!schema.title && !schema.$id) {
                Utils.snackbar('JSON Schema must have a "title" or "$id" field');
            }

            const interfaceName = schema.title || schema.$id.split('/').pop();
            const contents = [];

            // Convert properties
            if (schema.properties) {
                for (const [propName, propDef] of Object.entries(schema.properties)) {
                    const dtdlSchema = mapJsonSchemaToDTDL(propDef.type, propDef);
                    const isRequired = schema.required?.includes(propName);

                    // Decide if it's telemetry or property based on readOnly
                    const contentType = propDef.readOnly ? 'Telemetry' : 'Property';

                    const content = {
                        '@type': contentType,
                        name: propName,
                        schema: dtdlSchema,
                        ...(propDef.description && { description: propDef.description }),
                        ...(propDef.title && { displayName: propDef.title }),
                        ...(contentType === 'Property' && { writable: !isRequired })
                    };

                    contents.push(content);
                }
            }

            // Build DTDL
            const dtdl = {
                '@context': ['dtmi:dtdl:context;4'],
                '@id': `dtmi:custom:${interfaceName};1`,
                '@type': 'Interface',
                displayName: schema.title || interfaceName,
                description: schema.description || `Converted from JSON Schema`,
                contents: contents
            };

            generatedJSON = [dtdl];
            generatedDTDL = JSON.stringify(dtdl, null, 2);


            await validateDTDL(generatedDTDL);


            await checkQuality(generatedDTDL);

            Utils.snackbar('[DTDL/Generate] DTDL generated from JSON Schema!', 'success');
        } catch (error) {
            Utils.snackbar(`[DTDL/Generate] Conversion error: ${error.message}`);

            validationResult = { valid: false, error: error.message };
        } finally {
            isProcessing = false;
        }
    }

    function mapJsonSchemaToDTDL(type, propDef) {
        switch (type) {
            case 'string':
                if (propDef.format === 'date-time') return 'dateTime';
                if (propDef.format === 'date') return 'date';
                if (propDef.format === 'time') return 'time';
                if (propDef.format === 'duration') return 'duration';
                return 'string';
            case 'number':
                return propDef.multipleOf === 1 ? 'integer' : 'double';
            case 'integer':
                return 'integer';
            case 'boolean':
                return 'boolean';
            case 'array':
                return {
                    '@type': 'Array',
                    elementSchema: mapJsonSchemaToDTDL(
                        propDef.items?.type || 'string',
                        propDef.items || {}
                    )
                };
            case 'object':
                // Complex objects need Map or Object schema
                return 'string'; // Simplified for now
            default:
                return 'string';
        }
    }

    function addTelemetry() {
        templateParams.telemetries = [
            ...templateParams.telemetries,
            { name: '', schema: 'double', displayName: '', unit: '' }
        ];
    }

    function removeTelemetry(index) {
        templateParams.telemetries = templateParams.telemetries.filter((_, i) => i !== index);
    }

    function addProperty() {
        templateParams.properties = [
            ...templateParams.properties,
            { name: '', schema: 'string', displayName: '', writable: true }
        ];
    }

    function removeProperty(index) {
        templateParams.properties = templateParams.properties.filter((_, i) => i !== index);
    }

    function addCommand() {
        templateParams.commands = [...templateParams.commands, { name: '', displayName: '' }];
    }

    function removeCommand(index) {
        templateParams.commands = templateParams.commands.filter((_, i) => i !== index);
    }

    function loadTemplate(templateKey) {
        selectedTemplate = templateKey;
        const template = templates[templateKey];

        // Reset params with template defaults
        templateParams = {
            name: '',
            namespace: 'custom',
            displayName: '',
            description: '',
            telemetries: template.defaults.telemetries ? [...template.defaults.telemetries] : [],
            properties: template.defaults.properties ? [...template.defaults.properties] : [],
            commands: template.defaults.commands ? [...template.defaults.commands] : []
        };
    }
</script>

<div class="generate-container">
    <Nav tabs>
        <NavItem>
            <NavLink active={activeTab === 'llm'} on:click={() => (activeTab = 'llm')}>
                LLM Generation
            </NavLink>
        </NavItem>
        <NavItem>
            <NavLink active={activeTab === 'template'} on:click={() => (activeTab = 'template')}>
                Template
            </NavLink>
        </NavItem>
        <NavItem>
            <NavLink active={activeTab === 'schema'} on:click={() => (activeTab = 'schema')}>
                JSON Schema
            </NavLink>
        </NavItem>
    </Nav>

    {#if activeTab === 'llm'}
        <!-- LLM Generation Tab -->
        <div class="pt-3">
            <div class="mb-3">
                <Label>Describe your DTDL model in natural language:</Label>
                <Input
                    type="textarea"
                    rows={4}
                    bind:value={textualDescription}
                    placeholder="Example: Create a temperature sensor with humidity and pressure telemetry, plus a calibration command..."
                    disabled={isProcessing}
                />
            </div>

            <div class="mb-3">
                <small style="color: #6c757d;">Example descriptions:</small>
                <div class="d-flex flex-wrap gap-2 mt-1">
                    {#each exampleDescriptions as example}
                        <Button
                            size="sm"
                            color="secondary"
                            outline
                            on:click={() => useExampleDescription(example)}
                            disabled={isProcessing}
                            style="color: #495057;"
                        >
                            {example.substring(0, 40)}...
                        </Button>
                    {/each}
                </div>
            </div>

            <div class="mb-3">
                <Button
                    color="primary"
                    on:click={generateFromLLM}
                    disabled={isProcessing || !textualDescription.trim()}
                >
                    {#if isProcessing}
                        <Spinner size="sm" /> Generating...
                    {:else}
                        Generate DTDL
                    {/if}
                </Button>
            </div>

            {#if rawLLMOutput && (validationResult?.error || !generatedDTDL)}
                <Card class="mb-3 border-warning">
                    <CardBody>
                        <CardTitle>Raw LLM Output</CardTitle>
                        <details>
                            <summary style="cursor: pointer; user-select: none;">
                                <small class="text-muted"
                                    >Click to expand and see what the LLM actually returned</small
                                >
                            </summary>
                            <pre
                                class="code-preview mt-2"
                                style="max-height: 300px; font-size: 0.75rem;">{rawLLMOutput}</pre>
                        </details>
                    </CardBody>
                </Card>
            {/if}

            {#if aspConstraints}
                <Alert color="info" fade={false}>
                    <strong>ASP Constraints:</strong>
                    <pre class="constraint-preview mb-0 mt-2">{aspConstraints}</pre>
                </Alert>
            {/if}

            {#if validationResult}
                {#if validationResult.valid}
                    <Alert color="success" fade={false}>
                        DTDL is valid!
                        {#if qualityScore !== null}
                            <br />Quality Score: {qualityScore}%
                        {/if}
                    </Alert>
                {:else if validationResult.warning}
                    <Alert color="warning" fade={false}>
                        {validationResult.warning}
                        <br /><small>{validationResult.error}</small>
                    </Alert>
                {:else}
                    <Alert color="danger" fade={false}>
                        <strong>Generation failed</strong><br />
                        {validationResult.error}
                        <hr style="margin: 0.5rem 0;" />
                        <small>
                            <strong>Possible causes:</strong><br />
                            - Using a code completion model instead of a chat model<br />
                            - Model returned malformed output with special tokens<br />
                            - Check the "Raw LLM Output" section to see what was returned
                        </small>
                    </Alert>
                {/if}
            {/if}

            {#if generatedDTDL}
                <Card class="mt-3">
                    <CardBody>
                        <CardTitle>Generated DTDL:</CardTitle>
                        <pre class="code-preview">{generatedDTDL}</pre>
                        <ButtonGroup>
                            <Button color="success" size="sm" on:click={downloadDTDL}
                                >Download JSON</Button
                            >
                            <Button color="primary" size="sm" on:click={sendToPipeline}>
                                Send to Pipeline
                            </Button>
                        </ButtonGroup>
                    </CardBody>
                </Card>
            {/if}
        </div>
    {:else if activeTab === 'template'}
        <!-- Template Tab -->
        <div class="pt-3">
            <div class="mb-3">
                <Label>Select Template:</Label>
                <div class="d-flex gap-2 mb-3">
                    {#each Object.entries(templates) as [key, template]}
                        <Button
                            color={selectedTemplate === key ? 'primary' : 'outline-secondary'}
                            on:click={() => loadTemplate(key)}
                            disabled={isProcessing}
                        >
                            {template.name}
                        </Button>
                    {/each}
                </div>
                {#if selectedTemplate}
                    <small style="color: #6c757d;">{templates[selectedTemplate].description}</small>
                {/if}
            </div>

            {#if selectedTemplate}
                <div class="mb-3">
                    <Label>Interface Name *</Label>
                    <Input
                        type="text"
                        bind:value={templateParams.name}
                        placeholder="e.g., TemperatureSensor"
                        disabled={isProcessing}
                    />
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <Label>Display Name</Label>
                        <Input
                            type="text"
                            bind:value={templateParams.displayName}
                            placeholder="Human-readable name"
                            disabled={isProcessing}
                        />
                    </div>
                    <div class="col-md-6">
                        <Label>Namespace</Label>
                        <Input
                            type="text"
                            bind:value={templateParams.namespace}
                            placeholder="e.g., custom"
                            disabled={isProcessing}
                        />
                    </div>
                </div>

                <div class="mb-3">
                    <Label>Description</Label>
                    <Input
                        type="textarea"
                        rows={2}
                        bind:value={templateParams.description}
                        placeholder="Interface description"
                        disabled={isProcessing}
                    />
                </div>

                <!-- Telemetries Section -->
                <Card class="mb-3">
                    <CardBody>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <CardTitle class="mb-0">Telemetries</CardTitle>
                            <Button
                                size="sm"
                                color="success"
                                on:click={addTelemetry}
                                disabled={isProcessing}
                            >
                                Add
                            </Button>
                        </div>
                        {#each templateParams.telemetries as tel, i}
                            <div class="row mb-2">
                                <div class="col-md-3">
                                    <Input
                                        type="text"
                                        bind:value={tel.name}
                                        placeholder="name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-3">
                                    <Input
                                        type="select"
                                        bind:value={tel.schema}
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    >
                                        <option value="double">double</option>
                                        <option value="integer">integer</option>
                                        <option value="string">string</option>
                                        <option value="boolean">boolean</option>
                                        <option value="dateTime">dateTime</option>
                                    </Input>
                                </div>
                                <div class="col-md-3">
                                    <Input
                                        type="text"
                                        bind:value={tel.unit}
                                        placeholder="unit (optional)"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-2">
                                    <Input
                                        type="text"
                                        bind:value={tel.displayName}
                                        placeholder="display name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-1">
                                    <Button
                                        size="sm"
                                        color="danger"
                                        on:click={() => removeTelemetry(i)}
                                        disabled={isProcessing}
                                    >
                                        X
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    </CardBody>
                </Card>

                <!-- Properties Section -->
                <Card class="mb-3">
                    <CardBody>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <CardTitle class="mb-0">Properties</CardTitle>
                            <Button
                                size="sm"
                                color="success"
                                on:click={addProperty}
                                disabled={isProcessing}
                            >
                                Add
                            </Button>
                        </div>
                        {#each templateParams.properties as prop, i}
                            <div class="row mb-2">
                                <div class="col-md-3">
                                    <Input
                                        type="text"
                                        bind:value={prop.name}
                                        placeholder="name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-3">
                                    <Input
                                        type="select"
                                        bind:value={prop.schema}
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    >
                                        <option value="string">string</option>
                                        <option value="double">double</option>
                                        <option value="integer">integer</option>
                                        <option value="boolean">boolean</option>
                                        <option value="dateTime">dateTime</option>
                                    </Input>
                                </div>
                                <div class="col-md-2">
                                    <Input
                                        type="text"
                                        bind:value={prop.displayName}
                                        placeholder="display name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-2">
                                    <div class="form-check">
                                        <input
                                            type="checkbox"
                                            class="form-check-input"
                                            id="writable-{i}"
                                            bind:checked={prop.writable}
                                            disabled={isProcessing}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="writable-{i}"
                                            style="font-size: 0.875rem;"
                                        >
                                            Writable
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-1">
                                    <Button
                                        size="sm"
                                        color="danger"
                                        on:click={() => removeProperty(i)}
                                        disabled={isProcessing}
                                    >
                                        X
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    </CardBody>
                </Card>

                <!-- Commands Section -->
                <Card class="mb-3">
                    <CardBody>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <CardTitle class="mb-0">Commands</CardTitle>
                            <Button
                                size="sm"
                                color="success"
                                on:click={addCommand}
                                disabled={isProcessing}
                            >
                                Add
                            </Button>
                        </div>
                        {#each templateParams.commands as cmd, i}
                            <div class="row mb-2">
                                <div class="col-md-5">
                                    <Input
                                        type="text"
                                        bind:value={cmd.name}
                                        placeholder="name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-6">
                                    <Input
                                        type="text"
                                        bind:value={cmd.displayName}
                                        placeholder="display name"
                                        bsSize="sm"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div class="col-md-1">
                                    <Button
                                        size="sm"
                                        color="danger"
                                        on:click={() => removeCommand(i)}
                                        disabled={isProcessing}
                                    >
                                        X
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    </CardBody>
                </Card>

                <div class="mb-3">
                    <Button
                        color="primary"
                        on:click={generateFromTemplate}
                        disabled={isProcessing || !templateParams.name}
                    >
                        {#if isProcessing}
                            <Spinner size="sm" /> Generating...
                        {:else}
                            Generate from Template
                        {/if}
                    </Button>
                </div>
            {/if}

            {#if validationResult}
                {#if validationResult.valid}
                    <Alert color="success" fade={false}>
                        DTDL is valid!
                        {#if qualityScore !== null}
                            <br />Quality Score: {qualityScore}%
                        {/if}
                    </Alert>
                {:else if validationResult.warning}
                    <Alert color="warning" fade={false}>
                        {validationResult.warning}
                        <br /><small>{validationResult.error}</small>
                    </Alert>
                {:else}
                    <Alert color="danger" fade={false}>
                        <strong>Generation failed</strong><br />
                        {validationResult.error}
                        <hr style="margin: 0.5rem 0;" />
                        <small>
                            <strong>Possible causes:</strong><br />
                            - Using a code completion model instead of a chat model<br />
                            - Model returned malformed output with special tokens<br />
                            - Check the "Raw LLM Output" section to see what was returned
                        </small>
                    </Alert>
                {/if}
            {/if}

            {#if generatedDTDL}
                <Card class="mt-3">
                    <CardBody>
                        <CardTitle>Generated DTDL:</CardTitle>
                        <pre class="code-preview">{generatedDTDL}</pre>
                        <ButtonGroup>
                            <Button color="success" size="sm" on:click={downloadDTDL}
                                >Download JSON</Button
                            >
                            <Button color="primary" size="sm" on:click={sendToPipeline}>
                                Send to Pipeline
                            </Button>
                        </ButtonGroup>
                    </CardBody>
                </Card>
            {/if}
        </div>
    {:else if activeTab === 'schema'}
        <!-- Schema Tab -->
        <div class="pt-3">
            <div class="mb-3">
                <Label>Paste JSON Schema or OpenAPI specification:</Label>
                <Input
                    type="textarea"
                    rows={12}
                    bind:value={jsonSchemaInput}
                    placeholder={`Example JSON Schema:
{
  "title": "TemperatureSensor",
  "type": "object",
  "description": "A temperature sensor",
  "properties": {
    "temperature": {
      "type": "number",
      "description": "Current temperature",
      "readOnly": true
    },
    "unit": {
      "type": "string",
      "enum": ["celsius", "fahrenheit"]
    }
  },
  "required": ["temperature"]
}`}
                    disabled={isProcessing}
                    style="font-family: monospace; font-size: 0.875rem;"
                />
            </div>

            <div class="mb-3">
                <Alert color="info" fade={false}>
                    <strong>Conversion rules:</strong>
                    <ul class="mb-0 mt-2" style="font-size: 0.875rem;">
                        <li><code>readOnly: true</code>Telemetry</li>
                        <li><code>readOnly: false</code> or no readOnly Property</li>
                        <li><code>required</code> fields non-writable properties</li>
                        <li>
                            Type mapping: string→string, number→double, integer→integer,
                            boolean→boolean
                        </li>
                        <li><code>format: "date-time"</code>dateTime schema</li>
                    </ul>
                </Alert>
            </div>

            <div class="mb-3">
                <Button
                    color="primary"
                    on:click={generateFromSchema}
                    disabled={isProcessing || !jsonSchemaInput.trim()}
                >
                    {#if isProcessing}
                        <Spinner size="sm" /> Converting...
                    {:else}
                        Convert to DTDL
                    {/if}
                </Button>
            </div>

            {#if validationResult}
                {#if validationResult.valid}
                    <Alert color="success" fade={false}>
                        DTDL is valid!
                        {#if qualityScore !== null}
                            <br />Quality Score: {qualityScore}%
                        {/if}
                    </Alert>
                {:else if validationResult.warning}
                    <Alert color="warning" fade={false}>
                        {validationResult.warning}
                        <br /><small>{validationResult.error}</small>
                    </Alert>
                {:else}
                    <Alert color="danger" fade={false}>
                        <strong>Generation failed</strong><br />
                        {validationResult.error}
                        <hr style="margin: 0.5rem 0;" />
                        <small>
                            <strong>Possible causes:</strong><br />
                            - Using a code completion model instead of a chat model<br />
                            - Model returned malformed output with special tokens<br />
                            - Check the "Raw LLM Output" section to see what was returned
                        </small>
                    </Alert>
                {/if}
            {/if}

            {#if generatedDTDL}
                <Card class="mt-3">
                    <CardBody>
                        <CardTitle>Generated DTDL:</CardTitle>
                        <pre class="code-preview">{generatedDTDL}</pre>
                        <ButtonGroup>
                            <Button color="success" size="sm" on:click={downloadDTDL}
                                >Download JSON</Button
                            >
                            <Button color="primary" size="sm" on:click={sendToPipeline}>
                                Send to Pipeline
                            </Button>
                        </ButtonGroup>
                    </CardBody>
                </Card>
            {/if}
        </div>
    {/if}
</div>

<style>
    .generate-container {
        padding: 1rem;
        background: white;
        color: #212529;
    }

    .generate-container :global(label) {
        color: #212529 !important;
        font-weight: 500;
    }

    .generate-container :global(.text-muted),
    .generate-container :global(small) {
        color: #6c757d !important;
    }

    .generate-container :global(.btn-outline-secondary) {
        color: #495057 !important;
        border-color: #6c757d;
    }

    .generate-container :global(.btn-outline-secondary:hover) {
        color: white !important;
        background-color: #6c757d;
        border-color: #6c757d;
    }

    .generate-container :global(input),
    .generate-container :global(textarea) {
        color: #212529 !important;
    }

    .code-preview {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 1rem;
        max-height: 400px;
        overflow: auto;
        font-size: 0.875rem;
        color: #212529;
    }

    .constraint-preview {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        padding: 0.75rem;
        font-size: 0.875rem;
        color: #212529;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    :global(.nav-tabs) {
        border-bottom: 1px solid #dee2e6;
    }

    :global(.nav-link) {
        color: #495057 !important;
    }

    :global(.nav-link.active) {
        color: #0d6efd !important;
        font-weight: 600;
    }

    details summary {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }

    details summary:hover {
        background: #e9ecef;
    }

    details[open] summary {
        border-bottom: 2px solid #dee2e6;
        margin-bottom: 1rem;
    }
</style>
