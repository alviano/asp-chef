<script>
    import { Model } from "survey-core";
    import "survey-js-ui";
    import "survey-core/defaultV2.min.css";
    import {Utils} from "$lib/utils.js";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import {Button} from "@sveltestrap/sveltestrap";
    // import { LayeredDarkPanelless } from "survey-core/themes";

    export let part;
    export let index;
    export let configuration_atom;
    export let data;
    export let on_data_change = (data) => {};

    let survey_container;
    let survey;

    $: survey && data ? survey.data = data : null;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. SurveyJS`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. SurveyJS`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            survey = new Model(configuration);
            survey.showCompleteButton = false;
            survey.render(survey_container);
            // survey.applyTheme(LayeredDarkPanelless);
            // survey.onValueChanged.add(sender => {
            //     if (survey.validate()) {
            //         on_data_change(sender.data);
            //     }
            // })
        } catch (err) {
            Utils.snackbar(`#${index + 1}. SurveyJS: ${err}`);
        }
    });
</script>

<div class="survey-container" bind:this={survey_container}></div>
<Button on:click={() => { if (survey.validate()) on_data_change(survey.data) } }>OK</Button>
<Button on:click={() => on_data_change(null) }>Clear</Button>