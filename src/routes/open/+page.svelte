<script>
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const [replacement, recipe] = location.hash.slice(1).split(';');
    const replace = Utils.uncompress(replacement);
    const data = Recipe.deserialize(recipe);
    delete data.input;
    const new_recipe = Recipe.serialize(replace.input, {...data});
    location = `/#${new_recipe}`;
</script>

