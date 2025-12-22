<script>
    import CodeMirror from "svelte-codemirror-editor";
    import {consts} from "$lib/consts";

    let {value = $bindable(''),  ...props} = $props();

</script>

{#if consts.TESTING}
    <textarea class="w-100 vh-100" bind:value></textarea>
{:else}
    <CodeMirror bind:value {...props} />
{/if}

