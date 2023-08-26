import {get} from "svelte/store";
import {Utils} from "$lib/utils";
import {errors_at_index, processing_index, recipe} from "$lib/stores";
import {consts} from "$lib/consts";
import {v4 as uuidv4} from 'uuid';
import {Base64} from "js-base64";

export class Recipe {
    private static operation_types = new Map();
    private static uncachable_operations_types = new Set();
    private static last_serialization = null;
    private static cached_output = [];
    private static aborted = false;
    private static stores = new Map();

    private static get recipe() {
        return get(recipe);
    }

    private static get errors_at_index() {
        return get(errors_at_index);
    }

    static async svelte_components(filter: string) {
        const res = [];
        for (const key of Array.from(this.operation_types.keys()).sort()) {
            if (String(key).match(new RegExp(filter, 'i'))) {
                const component = (await import(`./operations/${String(key).replace(/ /g, '')}.svelte`)).default;
                res.push(component);
            }
        }
        return res;
    }

    static register_operation_type(
        operation: string,
        apply: (input: string[][], options: object, index: number, id: string) => Promise<string[][]>,
    ) {
        this.operation_types.set(operation, apply);
    }

    static new_uncachable_operation_type(operation: string) {
        this.uncachable_operations_types.add(operation);
    }

    static common_default_options() {
        return {
            stop: false,
            apply: true,
            show: true,
            readonly: false,
        };
    }

    static serialize(input: string, {
        encode_input = false,
        decode_output = false,
        show_help = true,
        show_operations = true,
        show_io_panel = true,
        show_ingredient_details = true,
        readonly_ingredients = false,
        show_ingredient_headers = true,
        pause_baking = false,
    } = {}) {
        const json = {
            input: encode_input ? input : input.split(consts.SYMBOLS.MODELS_SEPARATOR),
            encode_input,
            decode_output,
            show_help,
            show_operations,
            show_io_panel,
            show_ingredient_details,
            readonly_ingredients,
            show_ingredient_headers,
            pause_baking,
            recipe: this.recipe,
        };
        this.last_serialization = Utils.compress(json) + '%21';
        return this.last_serialization;
    }

    static deserialize(serialized_data: string) {
        if (serialized_data === this.last_serialization) {
            return null;
        }
        serialized_data = decodeURI(serialized_data);
        if (!serialized_data.endsWith('!')) {
            throw Error('Cannot deserialize. Incomplete string. Must terminate with a bang!');
        }
        this.last_serialization = serialized_data;
        const json = Utils.uncompress(serialized_data.slice(0, -1));
        recipe.set(json.recipe);
        if (!json.encode_input) {
            json.input = json.input ? json.input.join(consts.SYMBOLS.MODELS_SEPARATOR) : "";
        }
        return {
            input: json.input,
            encode_input: json.encode_input || false,
            decode_output: json.decode_output || false,
            show_help: json.show_help !== false,
            show_operations: json.show_operations !== false,
            show_io_panel: json.show_io_panel !== false,
            show_ingredient_details: json.show_ingredient_details !== false,
            readonly_ingredients: json.readonly_ingredients || false,
            show_ingredient_headers: json.show_ingredient_headers !== false,
            pause_baking: json.pause_baking || false,
        };
    }

    static async expand_if_short_link(recipe_url: string) : Promise<string> {
        try {
            if (recipe_url.match(/^https?:\/\/(shrtco.de|9qr.de|shiny.link)\//)) {
                const code = new URL(recipe_url).pathname.substring(1);
                const json = await fetch(`https://api.shrtco.de/v2/info?code=${code}`).then(response => response.json());
                return json.result.url;
            }
        } catch (error) {
            /* empty */
        }
        return recipe_url;
    }

    static async shorten_link(recipe_url: string) : Promise<string> {
        try {
            const json = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(recipe_url)}`).then(response => response.json());
            return json.result.full_short_link;
        } catch (error) {
            /* empty */
        }
        return recipe_url;
    }

    static serialize_ingredients(start: number, how_many = 0) {
        const json = {
            recipe: this.recipe.slice(start, how_many === 0 ? undefined : start + how_many),
        };
        return Utils.compress(json) + '%21';
    }

    static extract_recipe_from_serialization(serialized_data: string) {
        serialized_data = decodeURI(serialized_data);
        if (!serialized_data.endsWith('!')) {
            throw Error('Cannot deserialize. Incomplete string. Must terminate with a bang!');
        }
        const json = Utils.uncompress(serialized_data.slice(0, -1));
        return json.recipe;
    }

    static get number_of_operations() {
        return this.operation_types.size;
    }

    static get number_of_ingredients() {
        return this.recipe.length;
    }

    static id_of_ingredient(index: number) {
        return this.recipe[index].id;
    }

    static set_errors_at_index(index: number, errors: string, result: object[] = null) {
        const the_errors = this.errors_at_index;
        the_errors[index] = errors;
        errors_at_index.set(the_errors);
        if (result !== null) {
            result.push([{str: errors}])
        }
    }

    static store(id: string, value: object[][]) {
        this.stores.set(id, value);
    }

    static restore(id: string) {
        if (this.stores.has(id)) {
            return this.stores.get(id);
        }
        throw new Error('Unknown store ' + id)
    }

    static async abort() {
        this.aborted = true;
        await Utils.clingo_terminate();
    }

    static invalidate_cached_output(index: number) {
        while (index < this.cached_output.length) {
            this.set_errors_at_index(index, undefined);
            this.cached_output[index++] = undefined;
        }
    }

    static async process(input: string, encode_input: boolean): Promise<object[][]> {
        this.aborted = false;
        Utils.reset_config();
        let where = 'Input';
        processing_index.set(-1);
        try {
            let result = await this.process_input(input, encode_input);
            for (const [index, ingredient] of this.recipe.entries()) {
                if (this.aborted) {
                    break;
                }
                where = `#${index + 1}. ${ingredient.operation}`;
                processing_index.set(index);
                if (!this.uncachable_operations_types.has(ingredient.operation) && this.cached_output[index] !== undefined) {
                    result = ingredient.options.apply ? this.cached_output[index] : result;
                } else {
                    this.set_errors_at_index(index, undefined);
                    if (ingredient.options.apply) {
                        this.cached_output[index + 1] = undefined;
                        this.cached_output[index] = result = await Recipe.apply_operation_type(index, ingredient, result);
                    }
                }
                if (ingredient.options.stop) {
                    break;
                }
            }
            return result;
        } catch (error) {
            return [[
                { str: `Unrecoverable Error in ${where}` },
                { str: error },
            ]];
        } finally {
            processing_index.set(this.recipe.length);
        }
    }

    static async apply_operation_type(index: number, ingredient: object, input: string[][]) {
        if (!this.operation_types.has(ingredient.operation)) {
            throw Error('Unknown operation: ' + ingredient.operation);
        }
        return await this.operation_types.get(ingredient.operation)(input, ingredient.options, index, ingredient.id);
    }


    static async add_operation(operation: string, options: object, index: number = undefined) {
        const ingredient = {
            id: uuidv4(),
            operation,
            options: JSON.parse(JSON.stringify(options)),
        };
        const the_recipe = this.recipe;
        const INTERCEPTOR_OPERATOR = "Interceptor";
        const interceptor_index = the_recipe.findIndex(ingredient => ingredient.operation === INTERCEPTOR_OPERATOR);
        if (index === undefined) {
            index = operation !== INTERCEPTOR_OPERATOR ? interceptor_index : -1;
        }
        if (index === -1) {
            index = this.number_of_ingredients;
            the_recipe.push(ingredient);
        } else {
            this.invalidate_cached_output(index);
            the_recipe.splice(index, 0, ingredient);
        }
        if (operation === INTERCEPTOR_OPERATOR) {
            if (interceptor_index !== -1) {
                this.invalidate_cached_output(interceptor_index);
            }
            recipe.set(the_recipe.filter((ingredient, _index) => ingredient.operation !== INTERCEPTOR_OPERATOR || _index === index));
        } else {
            recipe.set(the_recipe);
        }
    }

    static edit_operation(id: string, index: number, options: object) {
        this.invalidate_cached_output(index);
        const the_recipe = this.recipe;
        if (the_recipe[index].id === id) {
            the_recipe[index].options = options;
        } else {
            const the_index = the_recipe.findIndex(ingredient => ingredient.id === id)
            if (the_index !== -1) {
                the_recipe[the_index].options = options;
            }
        }
        recipe.set(the_recipe);
    }

    static async process_input(input: string, encode: boolean) {
        if (encode) {
            return [[await Utils.parse_atom(`__base64__("${Base64.encode(input)}")`)]];
        }
        const res = [];
        for (const part of input.split(consts.SYMBOLS.MODELS_SEPARATOR)) {
            const atoms = await Utils.parse_answer_set(part);
            res.push(atoms);
        }
        return res;
    }

    static swap_operations(index_1: number, index_2: number) {
        this.invalidate_cached_output(Math.min(index_1, index_2));
        const the_recipe = this.recipe;
        const tmp = the_recipe[index_1];
        the_recipe[index_1] = the_recipe[index_2];
        the_recipe[index_2] = tmp;
        recipe.set(the_recipe);
    }

    static as_url() {
        const res = new URL(location.toString());
        res.hash = this.last_serialization;
        return res.toString();
    }

    static remove_all_operations() {
        this.invalidate_cached_output(0);
        recipe.set([]);
    }

    static remove_operation(index: number) {
        this.invalidate_cached_output(index);
        recipe.set(this.recipe.filter((value, the_index) => index !== the_index));
    }

    static remove_operations(index: number, how_many = 0) {
        this.invalidate_cached_output(index);
        recipe.set(this.recipe.filter((value, ingredient_index) => ingredient_index < index  || (how_many !== 0 && ingredient_index >= index + how_many)));
    }

    static duplicate_operation(index: number) {
        this.invalidate_cached_output(index + 1);
        const the_recipe = this.recipe;
        const copy = JSON.parse(JSON.stringify(the_recipe[index]));
        copy.id = uuidv4();
        the_recipe.splice(index, 0, copy);
        recipe.set(the_recipe);
    }

    static toggle_stop_at_operation(index: number) {
        this.invalidate_cached_output(index);
        const the_recipe = this.recipe;
        the_recipe[index].options.stop = !the_recipe[index].options.stop;
        recipe.set(the_recipe);
    }

    static toggle_apply_operation(index: number) {
        this.invalidate_cached_output(index);
        const the_recipe = this.recipe;
        the_recipe[index].options.apply = !the_recipe[index].options.apply;
        recipe.set(the_recipe);
    }

    static toggle_show_operation(index: number) {
        const the_recipe = this.recipe;
        the_recipe[index].options.show = !the_recipe[index].options.show;
        recipe.set(the_recipe);
    }

    static toggle_readonly_operation(index: number) {
        const the_recipe = this.recipe;
        the_recipe[index].options.readonly = !the_recipe[index].options.readonly;
        recipe.set(the_recipe);
    }
}