<script>
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const [replacement, recipe] = location.hash.slice(1).split(';');
    const replace = Utils.uncompress(replacement);
    const data = Recipe.deserialize(recipe);
    const new_recipe = Recipe.serialize(replace.input, data.encode_input, data.decode_output);
    location = `/#${new_recipe}`;
</script>

