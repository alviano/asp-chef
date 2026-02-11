<script context="module">
	import { Recipe } from '$lib/recipe';
	import { Base64 } from 'js-base64';
	import { Utils } from '$lib/utils.js';

	const operation = '@DTDL/Analysis';
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
	import { Button, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
	import Operation from '$lib/Operation.svelte';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import yaml from 'js-yaml';
	import analysisProgram from '$lib/operations/@DTDL/res/analysis.lp?raw';
	import Popover from '$lib/Popover.svelte';

	export let id;
	export let options;
	export let index;
	export let add_to_recipe;
	export let keybinding;

	const analysisStore = writable(null);
	$: analysisData = $analysisStore;

	function shortId(dtmi) {
		if (!dtmi) return dtmi;
		const parts = dtmi.split(':');
		return parts[parts.length - 1];
	}

	function parseResults(atoms) {
		const data = {
			stats: [],
			issues: { critical: 0, warning: 0, items: [] },
			hubs: [],
			communications: [],
			other: []
		};

		for (const atom of atoms) {
			if (atom.predicate === 'issue_count_critical') {
				data.issues.critical = atom.terms[0].number ?? parseInt(atom.terms[0].str);
			} else if (atom.predicate === 'issue_count_warning') {
				data.issues.warning = atom.terms[0].number ?? parseInt(atom.terms[0].str);
			} else if (atom.predicate.startsWith('stat_')) {
				const label = atom.predicate
					.replace('stat_', '')
					.replace(/_/g, ' ')
					.replace(/\b\w/g, (c) => c.toUpperCase());
				data.stats.push({
					label,
					value: atom.terms[0].number ?? atom.terms[0].str
				});
			} else if (atom.predicate === 'hub_interface') {
				data.hubs.push({
					id: atom.terms[0].string,
					connections: atom.terms[1].number ?? parseInt(atom.terms[1].str)
				});
			} else if (atom.predicate === 'can_communicate') {
				data.communications.push({
					from: atom.terms[0].string,
					to: atom.terms[1].string,
					hops: atom.terms[2].number ?? parseInt(atom.terms[2].str)
				});
			} else if (atom.predicate === 'design_issue') {
				const type = atom.terms[0].string
					.replace(/_/g, ' ')
					.replace(/\b\w/g, (c) => c.toUpperCase());
				data.issues.items.push({
					type,
					interfaceId: atom.terms[1].string,
					detail: atom.terms[2]?.string || ''
				});
			} else if (atom.predicate !== '__error__') {
				data.other.push(atom);
			}
		}

		return data;
	}

	onMount(() => {
		listeners.set(id, async (input) => {
			const analysisPredicate = analysisProgram;
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
						analysisPredicate;
					const models = await Utils.search_models(program, 1, false);
					models.forEach((model) => {
						res.push(Utils.parse_atoms(model));
					});
				} catch (error) {
					Recipe.set_errors_at_index(index, error, res);
				}
			}

			let debug_atoms = res.flat();
			analysisStore.update(() => {
				return parseResults(debug_atoms);
			});
		});
	});

	onDestroy(() => {
		listeners.set(id, null);
	});
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<InputGroup class="m-2 justify-content-end">
		<Popover
			title="Analysis results"
			value="Download the analysis results as JSON file. The JSON file contains the list of errors found in the DTDL model and suggestions for fixing them (if available)."
		>
			<Button class="m-1" on:click={() => Utils.download(analysisData, `analysis_${id}.json`)}
				><i class="bi bi-download"></i> <span>Analysis Json</span></Button
			>
		</Popover>
		<Popover
			title="Analysis results (YAML)"
			value="Download the analysis results as YAML file. The YAML file contains the list of errors found in the DTDL model and suggestions for fixing them (if available)."
		>
			<Button
				class="m-1"
				on:click={() => Utils.download(yaml.dump(analysisData), `analysis_${id}.yaml`)}
				><i class="bi bi-download"></i> <span>Analysis Yaml</span></Button
			>
		</Popover>
	</InputGroup>

	<div slot="output" class="p-2 output" data-testid="analisis-output">
		{#if analysisData === null}
			<em>No analysis information</em>
		{:else if analysisData.errors}
			<div class="analysis-errors">
				{#each analysisData.errors as err}
					<div class="alert alert-danger mb-1 p-2">{err}</div>
				{/each}
			</div>
		{:else}
			<div
				class="status-banner mb-2 p-2 text-center fw-bold"
				class:status-valid={analysisData.issues.items.length === 0}
				class:status-warning={analysisData.issues.items.length > 0}
			>
				{#if analysisData.issues.items.length === 0}
					VALID — No design issues found
				{:else}
					{analysisData.issues.items.length} design issue{analysisData.issues.items.length !== 1
						? 's'
						: ''} found
				{/if}
			</div>
			{#if analysisData.stats.length > 0}
				<div class="section-label">Statistics</div>
				<div class="stats-grid mb-2">
					{#each analysisData.stats as stat}
						<div class="stat-card">
							<div class="stat-value">{stat.value}</div>
							<div class="stat-label">{stat.label}</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if analysisData.hubs.length > 0}
				<div class="section-label">Hub Interfaces</div>
				<table class="table table-bordered table-sm mb-2">
					<thead>
						<tr>
							<th>Interface</th>
							<th class="text-center" style="width: 100px;">Connections</th>
						</tr>
					</thead>
					<tbody>
						{#each analysisData.hubs as hub}
							<tr>
								<td
									><code>{shortId(hub.id)}</code>
									<span class="text-muted dtmi-full">{hub.id}</span></td
								>
								<td class="text-center">{hub.connections}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}

			{#if analysisData.communications.length > 0}
				<div class="section-label">Communication Paths</div>
				<table class="table table-bordered table-sm mb-2">
					<thead>
						<tr>
							<th>From</th>
							<th>To</th>
							<th class="text-center" style="width: 60px;">Hops</th>
						</tr>
					</thead>
					<tbody>
						{#each analysisData.communications as comm}
							<tr>
								<td><code>{shortId(comm.from)}</code></td>
								<td><code>{shortId(comm.to)}</code></td>
								<td class="text-center">
									<span
										class="badge"
										class:bg-success={comm.hops === 1}
										class:bg-warning={comm.hops > 1}>{comm.hops}</span
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}

			{#if analysisData.issues.items.length > 0}
				<div class="section-label">Design Issues</div>
				{#each analysisData.issues.items as issue}
					<div class="issue-item mb-1">
						<span class="badge bg-warning text-dark me-1">{issue.type}</span>
						<code>{shortId(issue.interfaceId)}</code>
						{#if issue.detail}
							<span class="text-muted">— {issue.detail}</span>
						{/if}
					</div>
				{/each}
			{/if}

			{#if analysisData.other.length > 0}
				<details class="mt-2">
					<summary class="section-label" style="cursor: pointer;"
						>Other ({analysisData.other.length})</summary
					>
					<div class="p-1" style="font-family: monospace; font-size: 0.85em;">
						{#each analysisData.other as atom}
							<div>{atom.str}.</div>
						{/each}
					</div>
				</details>
			{/if}
		{/if}
	</div>
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
	.status-warning {
		border-color: #ffc107;
		background: #fff3cd;
		color: #664d03;
	}
	.section-label {
		font-weight: bold;
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #555;
		margin-bottom: 0.3em;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.4em;
	}
	.stat-card {
		border: 1px solid #ddd;
		padding: 0.4em;
		text-align: center;
		background: #f9f9f9;
	}
	.stat-value {
		font-size: 1.4em;
		font-weight: bold;
		font-family: monospace;
	}
	.stat-label {
		font-size: 0.75em;
		color: #666;
		text-transform: uppercase;
	}
	.output :global(th) {
		background-color: #777;
		color: white;
		font-size: 0.85em;
	}
	.output :global(td) {
		font-size: 0.85em;
		vertical-align: middle;
	}
	.dtmi-full {
		font-size: 0.75em;
		display: block;
	}
	.issue-item {
		padding: 0.3em 0.5em;
		border-left: 3px solid #ffc107;
		background: #fffdf5;
		font-size: 0.85em;
	}
</style>
