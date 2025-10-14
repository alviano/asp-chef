<script>
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const hash = location.hash || ";";
    const [replacement, recipe] = hash.slice(1).split(';');
    const replace = replacement ? Utils.uncompress(replacement) : { input: "" };
    const data = recipe ? Recipe.deserialize(recipe) : { recipe: [] };
    delete data.input;
    const new_recipe = Recipe.serialize(replace.input, {...data});
    location = `/#${new_recipe}`;
</script>

