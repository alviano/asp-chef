<!--
https://tinyurl.com/aschef points to https://asp-chef.alviano.net/s

register https://tinyurl.com/SOMETHING pointing to https://asp-chef.alviano.net/s?d=PATH#USERNAME/REPOSITORY
to use this shortening service on other GitHub accounts and repository
-->

<script>
    import {page} from '$app/state';
    import {Recipe} from "$lib/recipe";

    async function fetch_url() {
        const url = await Recipe.expand_if_short_link($page.url, false);
        if (url.toString() !== location.href.toString()) {
            location.href = url;
        } else {
            throw new Error("Unable to resolve the provided short link.");
        }
    }
</script>

{#await fetch_url()}
    Loading URL...
{:catch error}
    {error}
{/await}
