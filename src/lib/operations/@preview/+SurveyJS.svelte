<script>
    import { Model } from "survey-core";
    import "survey-js-ui";
    import "survey-core/survey-core.min.css";
    import {Utils} from "$lib/utils.js";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import {Button, Input} from "@sveltestrap/sveltestrap";
    // import { LayeredDarkPanelless } from "survey-core/themes";

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;
    export let input;
    export let on_output_change = (data) => {};
    export let on_value_change = (data) => {};

    let survey_container;
    let survey;
    

    $: survey && input ? survey.data = input : null;

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
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            survey = new Model(configuration);
            survey.data = input;
            survey.showCompleteButton = false;
            survey.render(survey_container);

            survey.onValueChanged.add(sender => {
                on_value_change(sender.data);
            });
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
<Button class="inputButton" on:click={() => { if (survey.validate()) on_output_change(survey.data) } }>OK</Button>
<Button class="inputButton" on:click={() => {on_output_change(null); on_value_change(null)}}>Clear</Button>
