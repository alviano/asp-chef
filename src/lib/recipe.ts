import {get} from "svelte/store";
import {Utils} from "$lib/utils";
import {
    errors_at_index,
    github_api_token,
    github_path,
    github_repository,
    github_username,
    processing_index,
    recipe,
    registered_javascript,
    registered_recipes,
} from "$lib/stores";
import {consts} from "$lib/consts";
import {v4 as uuidv4} from 'uuid';
import {Base64} from "js-base64";

export class Recipe {
    private static _operation_types = new Map();
    private static _operation_components = new Map();
    private static _operation_keys = [];
    private static uncachable_operations_types = new Set();
    private static _remote_javascript_operations = new Map();
    private static _remote_recipe_operations = new Map();
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

    static operation_component(operation_type: string) {
        return this._operation_components.get(this.operation_type_filename(operation_type));
    }

    static operation_components(filter: string) {
        const res = [];
        this._sort_operation_keys()
        for (const key of this._operation_keys) {
            if (String(key).match(new RegExp(filter, 'i'))) {
                res.push(this.operation_component(key));
            }
        }
        return res;
    }

    static async load_operation_components(feedback = (processed, total, file, skip, error) => { /* empty */ }) {
        const map = Object.entries(await import.meta.glob('/src/lib/operations/**/*.svelte'));
        this._remote_javascript_operations = new Map(Object.entries(get(registered_javascript)));
        this._remote_recipe_operations = new Map(Object.entries(get(registered_recipes)));
        let total = map.length + this._remote_javascript_operations.size + this._remote_recipe_operations.size;
        let processed = 0;
        feedback(processed, total, '', true, null);
        const promises = [];
        for (const [key, value] of map) {
            const the_key = key.slice(20, -7);
            const skip = the_key.startsWith('+');
            if (skip) {
                total--;
            } else {
                promises.push(value().then(component => {
                    this._operation_components.set(the_key, component.default);
                    processed++;
                    feedback(processed, total, the_key, skip, null);
                }));
            }
        }
        await Promise.all(promises);

        for (const [key, value] of [...this._remote_javascript_operations.entries()]) {
            let err = null;
            try {
                const new_key = await this.new_remote_javascript_operation(value.prefix, value.url, false);
                if (new_key !== key) {
                    this._remote_javascript_operations.delete(key);
                }
            } catch (error) {
                await this._new_remote_javascript_operation(value.prefix, value.url, value.code);
                err = `Oops! Cannot update ${key}... loaded latest fetched version.`;
            }
            processed++;
            feedback(processed, total, key, false, err);
        }
        this._update_registered_javascript_store();

        for (const [key, value] of [...this._remote_recipe_operations.entries()]) {
            let err = null;
            const new_key = await this.new_remote_recipe_operation(value.name, value.url, value.remappable_predicates, value.doc,false);
            if (new_key !== key) {
                this._remote_recipe_operations.delete(key);
            }
            processed++;
            feedback(processed, total, key, false, err);
        }
        this._update_registered_recipes_store();
    }

    static has_operation_type(key: string): boolean {
        return this._operation_types.has(key);
    }

    static _sort_operation_keys() {
        if (this._operation_keys.length !== this._operation_types.size) {
            this._operation_keys = Array.from(this._operation_types.keys()).sort((a, b) => {
                if (['@', '#', '&'].includes(a[0])) {
                    return ['@', '#'].includes(b[0]) ? a.localeCompare(b) : 1;
                }
                return ['@', '#', '&'].includes(b[0]) ? -1 : a.localeCompare(b);
            });
        }
    }

    static register_operation_type(
        operation: string,
        apply: (input: string[][], options: object, index: number, id: string) => Promise<string[][]>,
    ) {
        this._operation_types.set(operation, apply);
    }

    static operation_type_filename(operation: string) : string {
        return operation.replace(/ /g, '');
    }

    static new_uncachable_operation_type(operation: string) {
        this.uncachable_operations_types.add(operation);
    }

    static make_remote_javascript_operation_name(prefix: string, name: string) : string {
        return `&js-${prefix}/${name}`;
    }

    static make_remote_recipe_operation_name(name: string, prefix = "") : string {
        return `&r/${name}`;
    }

    private static async _new_remote_javascript_operation(prefix: string, url: string, code: string) {
        const {name, doc, options} = await Utils.worker_run(code, [], "DESCRIBE");
        const operation = this.make_remote_javascript_operation_name(prefix, name);
        this._remote_javascript_operations.set(operation, {
            prefix,
            name,
            url,
            code,
            doc,
            options,
        });
        this._operation_components.set(this.operation_type_filename(operation), operation);
        this._operation_types.set(operation, this._operation_types.get("Javascript"));

        return operation;
    }

    private static async _new_remote_recipe_operation(name: string, url: string, remappable_predicates: string[], doc: string) {
        const operation = this.make_remote_recipe_operation_name(name);
        this._remote_recipe_operations.set(operation, {
            name,
            url,
            remappable_predicates,
            doc,
        });
        this._operation_components.set(this.operation_type_filename(operation), operation);
        this._operation_types.set(operation, this._operation_types.get("Recipe"));

        return operation;
    }

    private static _update_registered_javascript_store() {
        registered_javascript.set(Object.fromEntries(this._remote_javascript_operations.entries()));
    }

    private static _update_registered_recipes_store() {
        registered_recipes.set(Object.fromEntries(this._remote_recipe_operations.entries()));
    }

    static async new_remote_javascript_operation(prefix: string, url: string, update_store = true) {
        const code = await fetch(url, {
            cache: Utils.browser_cache_policy,
        }).then(response => response.text());

        const operation = await this._new_remote_javascript_operation(prefix, url, code);
        if (update_store) {
            this._update_registered_javascript_store();
        }
        return operation;
    }

    static async new_remote_recipe_operation(name: string, url: string, remappable_predicates: string[], doc: string, update_store = true) {
        const operation = await this._new_remote_recipe_operation(name, url, remappable_predicates, doc);
        if (update_store) {
            this._update_registered_recipes_store();
        }
        return operation;
    }

    static unregister_remote_javascript_operation(operation: string, update_store = true) {
        if (!this.is_remote_javascript_operation(operation)) {
            throw new Error("Expecting a remote Javascript operation");
        }
        this._remote_javascript_operations.delete(operation);
        this._operation_components.delete(operation);
        this._operation_types.delete(operation);

        if (update_store) {
            this._update_registered_javascript_store();
        }
    }

    static unregister_remote_recipe_operation(operation: string, update_store = true) {
        if (!this.is_remote_recipe_operation(operation)) {
            throw new Error("Expecting a remote Recipe operation");
        }
        this._remote_recipe_operations.delete(operation);
        this._operation_components.delete(operation);
        this._operation_types.delete(operation);

        if (update_store) {
            this._update_registered_recipes_store();
        }
    }

    static is_remote_javascript_operation(operation: string) {
        return this._remote_javascript_operations.has(operation);
    }

    static is_remote_recipe_operation(operation: string) {
        return this._remote_recipe_operations.has(operation);
    }

    static remappable_predicate_in_remove_recipe_operation(operation: string) {
        return this._remote_recipe_operations.get
    }

    static get_remote_javascript_operation(operation: string) {
        return this._remote_javascript_operations.get(operation);
    }

    static get_remote_recipe_operation(operation: string) {
        return this._remote_recipe_operations.get(operation);
    }

    static common_default_options() {
        return {
            stop: false,
            apply: true,
            show: true,
            readonly: false,
            hide_header: false,
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
        const the_recipe_url = new URL(recipe_url);
        const parts = Utils.split_with_limit(the_recipe_url.pathname, "/", 3);
        if (parts.length === 3 && parts[1] === "s") {
            const path = decodeURIComponent(parts[2]).replace(/\+/g, ' ');
            const hash = the_recipe_url.hash;
            const user_repo = hash ? hash.substring(1) : `${consts.SHORT_LINKS_DEFAULT_USERNAME}/${consts.SHORT_LINKS_DEFAULT_REPOSITORY}`;
            const url = `${consts.GITHUB_API_DOMAIN}/repos/${user_repo}/contents/${path}.url`;
            const options = {
                headers: {
                    Accept: "application/vnd.github.raw+json",
                }
            };
            if (get(github_api_token)) {
                options.headers["Authorization"] = `Bearer ${get(github_api_token)}`;
            }
            const response = await fetch(url, options);
            if (response.status !== 200) {
                throw new Error(`Cannot load ${url}`);
            }
            const contentType = response.headers.get("content-type");
            let content;
            if (contentType.startsWith("application/json")) {
                const json = await response.json();
                content = Base64.decode(json.content)
            } else {
                content = await response.text();
            }
            const expanded_url = new URL(content);
            return `${consts.DOMAIN}${expanded_url.hash}`;
        } else {
            return recipe_url;
        }
    }

    static async shorten_link(recipe_url: string) : Promise<string> {
        if (get(github_api_token) === '') {
            throw new Error("Missing GitHub API Token")
        }
        const username = get(github_username) || consts.SHORT_LINKS_DEFAULT_USERNAME;
        const repository = get(github_repository) || consts.SHORT_LINKS_DEFAULT_REPOSITORY;
        const path = get(github_path) || uuidv4();
        const url = `${consts.GITHUB_API_DOMAIN}/repos/${username}/${repository}/contents/${path}.url`;
        const headers = {
            "Authorization": `Bearer ${get(github_api_token)}`,
        };

        let response = await fetch(url, {
            headers,
            cache: "no-store",
        });
        const body = {
            message: "short link",
            committer: {
                name: "ASP Chef",
                email: "asp-chef@example.com",
            },
            content: Base64.encode(recipe_url),
        };
        if (response.status === 200) {
            const json = await response.json();
            body.sha = json.sha;
        }
        response = await fetch(url, {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
        });
        if (response.status !== 200 && response.status !== 201) {
            throw new Error("Failed to write on GitHub")
        }

        const hash = username === consts.SHORT_LINKS_DEFAULT_USERNAME && repository === consts.SHORT_LINKS_DEFAULT_REPOSITORY ? "" : `#${username}/${repository}`;
        return `${consts.DOMAIN}/s/${path}${hash}`;
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
        return this._operation_types.size;
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
        await Utils.worker_terminate();
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
        if (!this._operation_types.has(ingredient.operation)) {
            throw Error('Unknown operation: ' + ingredient.operation);
        }
        return await this._operation_types.get(ingredient.operation)(input, ingredient.options, index, ingredient.id);
    }

    static async add_operation(operation: string, options: object, index: number = undefined) {
        if (this.is_remote_recipe_operation(operation)) {
            const recipe = Recipe.get_remote_recipe_operation(operation);
            options = {
                ...options,
                ...recipe,
                predicate_mapping: (Recipe.get_remote_recipe_operation(operation).remappable_predicates || []).map((pred) => [pred, '']),
                locked: true,
            };
            options.remappable_predicates = undefined;
            operation = "Recipe";
        }

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

    static fix_operation(id: string, index: number, operation: string) {
        this.invalidate_cached_output(index);
        const the_recipe = this.recipe;
        if (the_recipe[index].id === id) {
            the_recipe[index].operation = operation;
        } else {
            const the_index = the_recipe.findIndex(ingredient => ingredient.id === id)
            if (the_index !== -1) {
                the_recipe[the_index].operation = operation;
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
        res.hash = this.last_serialization || '';
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

    static toggle_hide_header_operation(index: number) {
        const the_recipe = this.recipe;
        the_recipe[index].options.hide_header = !the_recipe[index].options.hide_header;
        recipe.set(the_recipe);
    }

    static get number_of_hidden_headers() {
        return this.recipe.filter(ingredient => ingredient.options.hide_header).length;
    }
}