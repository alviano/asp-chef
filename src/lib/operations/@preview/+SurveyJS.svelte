<script>
    import {Model} from "survey-core";
    import "survey-js-ui";
    import "survey-core/survey-core.min.css";
    import {Utils} from "$lib/utils.js";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import {Button} from "@sveltestrap/sveltestrap";

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;
    export let data;
    export let on_ok = (data) => {};
    export let on_clear = (data) => {};

    let survey_container;
    let survey;

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
            if (data) {
                survey.data = data;
            }
            else if (configuration.data) {
                survey.data = configuration.data;
            }
            if (configuration.showCompleteButton === undefined) {
                survey.showCompleteButton = false;
            }
            survey.render(survey_container);

            //survey.onValueChanged.add(sender => {
                //on_value_change(sender.data);
            //});
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
<Button class="inputButton" on:click={() => { if (survey.validate()) on_ok(survey.data) } }>OK</Button>
<Button class="inputButton" on:click={() => { on_clear(); }}>Clear</Button>
