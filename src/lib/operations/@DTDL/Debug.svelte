<script context="module">
	import { Recipe } from '$lib/recipe';
	import { Base64 } from 'js-base64';
	import { Utils } from '$lib/utils.js';
	import { LLMs } from '$lib/operations/@LLMs/llms';

	const operation = '@DTDL/Debug';
	const default_extra_options = {
		predicate: '__base64__',
		prefix: ''
	};
	const listeners = new Map();

	Recipe.register_operation_type(operation, async (input, options, index, id) => {
		try {
			await listeners.get(id)(input);
		} catch (error) {
			/* component not mounted, possibly because of headless mode */
		}
		return options.echo
			? input
			: input.map((model) => model.filter((atom) => atom.predicate !== options.predicate));
	});
</script>

<script>
	import {
		Button,
		ButtonGroup,
		Icon,
		Input,
		InputGroup,
		InputGroupText,
		Modal,
		ModalBody,
		ModalFooter,
		ModalHeader
	} from '@sveltestrap/sveltestrap';
	import Operation from '$lib/Operation.svelte';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { ChatOpenAI } from '@langchain/openai';
	import { HumanMessage, SystemMessage } from '@langchain/core/messages';

	import debugProgram from '$lib/operations/@DTDL/res/debug.lp?raw';

	import Popover from '$lib/Popover.svelte';
	import { stream } from 'xlsx';

	export let id;
	export let options;
	export let index;
	export let add_to_recipe;
	export let keybinding;
	export let api_key = '';

	export let debug_output = writable(null);
	let debugData = null;
	debug_output.subscribe((value) => {
		debugData = value;
	});

	export let suggestedFixes = writable({});
	let suggestedFixesData = {};
	suggestedFixes.subscribe((value) => {
		suggestedFixesData = value;
	});

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
			Utils.snackbar('No error information available for this item.');
			return;
		}

		if (!actual_config.api_key.startsWith('sk-')) {
			Utils.snackbar(
				'Please enter your OperRouter API key to get suggestions for fixing the error.\nGet it for free at https://openrouter.ai/'
			);
			return;
		}

		suggestedFixes.update((fixes) => {
			return {
				...fixes,
				[i]: `Generating suggestion...`
			};
		});
		const chat = new ChatOpenAI({
			model: actual_config.model || default_config.model,
			temperature: parseFloat(actual_config.temperature || default_config.temperature || 0),
			streamUsage: actual_config.streamUsage || default_config.streamUsage || false,
			apiKey: actual_config.api_key,
			configuration: {
				baseURL: (actual_config.server || default_config.baseURL) + (actual_config.endpoint || '')
			}
		});

		let error = debugData.errors[i];

		const response = await chat.invoke([
			new SystemMessage(
				'You are a helpful assistant for debugging DTDL models. Based on the following error message, suggest a possible fix or improvement to resolve the issue:\n\n' +
					error
			),
			new HumanMessage(
				'Error: ' +
					error +
					'\n\nPlease provide a clear and concise suggestion for how to fix this error in the DTDL model. Max 200 words.'
			)
		]);

		suggestedFixes.update((fixes) => {
			return {
				...fixes,
				[i]: `${response.content}`
			};
		});
	}

	onMount(() => {
		listeners.set(id, async (input) => {
			const debugPredicate = debugProgram;
			const res = [];
			for (const part of input) {
				try {
					let program =
						part
							.map((atom) => {
								if (atom.predicate === options.decode_predicate) {
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
				Utils.snackbar(`No LLM configuration found. Using default configuration.`);
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
					Utils.snackbar(`@LLMs/Chat Completion: Cannot interpret configuration atom ${atom.str}`);
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

			let errors = [];

			for (const atom of debug_atoms) {
				let template_key = atom.terms[0].string;
				let rel, target, count, max, overflow, dtdl_interface, prop;

				switch (template_key) {
					case 'undefined_target':
						rel = atom.terms[1].string;
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
				}

				const error_templates = {
					undefined_target: `ERROR: Relationship '${rel}' references undefined interface '${target}'\nCheck DTDL model or add missing interface definition`,
					max_multiplicity_exceeded: `ERROR: Relationship '${rel}' exceeds maximum multiplicity\nCurrent: ${count}, Maximum: ${max}\nRemove ${overflow} instances`,
					missing_required_property: `ERROR: Interface '${dtdl_interface}' missing required property '${prop}'\nAdd property definition or mark as optional`
				};
				errors.push(error_templates[template_key]);
			}

			debug_output.set({
				status: errors.length > 0 ? 'FAILED' : 'VALID',
				count: errors.length,
				errors
			});
		});
	});

	onDestroy(() => {
		listeners.set(id, null);
	});
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<!-- This operation call external API (Openrouter via Langchain) to get suggestions for fixing the
	errors found in the DTDL model. Please make sure to set up your API key correctly to use this
	feature. Use @LLMs/Register API Key operation to register your API key for Openrouter. You can get
	a free API key by signing up at https://openrouter.ai/. This operation also provides an default
	configuration to use {default_config.model} model and {default_config.temperature} temperature. You
	can customize the configuration by providing atoms with predicate {default_config.predicate_config}
	in the input. You can do this using @LLMs/Config operation before the Debug operation in your recipe. -->

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
			value="Download the debug information as JSON. The debug information includes the list of errors found in the DTDL model and suggestions for fixing them (if available)."
		>
			<Button class="m-1" on:click={() => Utils.download(debugData, 'debug_errors.json')}
				><i class="bi bi-download"></i> <span>Error Json</span></Button
			>
		</Popover>
		<Popover
			title="Debug information"
			value="Download the debug information as YAML file. The debug information includes the list of errors found in the DTDL model and suggestions for fixing them (if available)."
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
	<div slot="output" class="p-2 output" data-testid="Markdown-output">
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
											{@html Utils.render_markdown(previewText(suggestedFixesData[i]))}
											{#if suggestedFixesData[i] && suggestedFixesData[i].length > previewLimit}
												<Button
													class="p-0 mt-1"
													color="link"
													on:click={() => openPreviewModal(suggestedFixesData[i])}
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
</Operation>

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

	.icon-sparkles {
		width: 1em;
		height: 1em;
		margin-right: 0.35em;
		vertical-align: -0.1em;
	}
</style>
