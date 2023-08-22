<script>
    import {Recipe} from "$lib/recipe";

    const recipe = location.hash.slice(1);
    const data = Recipe.deserialize(recipe);
    const the_input = data.input;
    delete data.input;
    const new_recipe = Recipe.serialize(the_input, {...data, pause_baking: true});
    location = `/#${new_recipe}`;
</script>

