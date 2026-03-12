<script>
    import {TabulatorFull as Tabulator} from 'tabulator-tables';
    import {onMount} from 'svelte';
    import {Utils} from "$lib/utils";

    export let model;

    let table;

    let columns = [];
    let data = [];
    let options = {};

    function get_value(term) {
        if (term.functor === 'false' || term.functor === 'False') {
            return false;
        }
        if (term.functor === 'true' || term.functor === 'True') {
            return true;
        }
        if (term.functor === 'null' || term.functor === 'None') {
            return null;
        }
        if (term.functor === 'undefined') {
            return undefined;
        }
        if (term.functor === 'json' && term.terms.length === 1) {
            try {
                return JSON.parse(term.terms[0].string.replaceAll('\\"', '"'));
            } catch (err) {
                Utils.snackbar(`Tabulator: ${err}`);
                return undefined;
            }
        }
        if (term.functor === 'json\'' && term.terms.length === 1) {
            try {
                return JSON.parse(term.terms[0].string.replaceAll('\'', '"'));
            } catch (err) {
                Utils.snackbar(`Tabulator: ${err}`);
                return undefined;
            }
        }
        return term.string || term.number || term.str;
    }

    model.forEach(atom => {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in Tabulator`);
            return;
        }
        atom = atom.terms[0];
        if (atom.functor === "config") {
            atom.terms.forEach(term => {
                if (term.functor !== undefined && term.functor !== 'columns' && term.functor !== 'data' && term.terms && term.terms.length === 1) {
                    options[term.functor] = get_value(term.terms[0]);
                } else {
                    Utils.snackbar(`Tabulator: Cannot interpret ${term.str}`)
                }
            });
        } else if (atom.functor === "column" || atom.functor === "col") {
            const index = atom.terms[0].number;
            while (columns.length < index) {
                columns.push({});
            }
            columns[index - 1] = {
                field: `${index}`,
                title: `Column ${index}`,
            };
            atom.terms.forEach((term, idx) => {
                if (idx === 0) {
                    return;
                }
                if (term.functor !== undefined && term.functor !== "field" && term.terms && term.terms.length === 1) {
                    columns[index - 1][term.functor] = get_value(term.terms[0]);
                } else {
                    Utils.snackbar(`Tabulator: Cannot interpret ${term.str}`)
                }
            });
        } else if (atom.functor === "") {
            data.push(Object.fromEntries([...atom.terms.map((term, index) => [`${index + 1}`, get_value(term)])]));
        } else {
            Utils.snackbar(`Unexpected term ${atom.predicate}/${atom.terms.length} in Tabulator`);
        }
    });

    onMount(() => {
        new Tabulator(table, {
            columns,
            data,
            layout: "fitData",
            rowHeader: { formatter: "rownum", headerSort: true, hozAlign: "right", resizable: true, frozen: true },
            resizableColumns: true,
            ...options,
        });
    });
</script>

<div bind:this={table}></div>

<style global>
  @import "https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css";
</style>