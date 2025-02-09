<script>
  import { Popover } from "@sveltestrap/sveltestrap";
  import newUniqueId from 'locally-unique-id-generator';
  import {show_help} from "$lib/stores";

  export let id = null;

  const random_id = newUniqueId();
  $: _id = id || random_id;

  export let value = null;
  export let placement = 'top';
  export let trigger = 'hover';
  export let title = '';
  export let isOpen = null;
  export let block = null;
</script>

{#if id}
  <slot class={block ? 'd-block' : 'd-inline-block'} />
{:else}
  <span id={_id} class={block ? 'd-block' : 'd-inline-block'}>
    <slot />
  </span>
{/if}
{#if $show_help}
  <Popover target={_id} {placement} {trigger} {isOpen} class={$$props.class}>
    <span slot="title">
      {#if title}
        {title}
      {:else}
        <slot name="title" />
      {/if}
    </span>

    {#if value}
      {value}
    {:else}
      <slot name="value" />
    {/if}
  </Popover>
{/if}