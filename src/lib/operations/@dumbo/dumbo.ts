import {Utils} from "$lib/utils";
import {Base64} from "js-base64";
import {get} from "svelte/store";
import {server_url} from "$lib/stores";

export class Dumbo {
    private static __core_templates = null;

    public static get PREDICATE() {
        return "__dumbo__";
    }

    public static validate_one_model(input) {
        if (input.length !== 1) {
            throw new Error("Expecting one model, not " + input.length);
        }
    }

    public static encode_program(program, predicate, prefix = "") {
        const encoded_term = Base64.encode(program);
        return Utils.parse_atom(`${predicate}(${prefix}"${encoded_term}")`);
    }

    public static async fetch(url, data) {
        const response = await fetch(`${get(server_url)}/dumbo/${url}`, {
            method: "POST",
            mode: "cors",
            cache: Utils.browser_cache_policy,
            credentials: "same-origin",
            headers: new Headers([["Content-Type", "application/json"]]),
            body: JSON.stringify(data),
        });
        const json = await response.json();
        if ("error" in json) {
            throw new Error(json.error);
        }
        return json;
    }

    public static async fetch_core_templates() {
        if (this.__core_templates === null) {
            const templates = new Map();
            const names = await Dumbo.fetch('template/core-template/', {});
            for (const name of names) {
                const template = await Dumbo.fetch("template/core-template/", {name: name});
                const predicates = template.predicates.map(pred => `\`${pred}\``).join(', ');
                template.documentation = `__Predicates:__ ${predicates}\n\n` + template.documentation.replaceAll('\n', '\n\n').replaceAll('\\n', '\n');
                templates.set(name, template);
            }
            this.__core_templates = templates;
        }
        return [...this.__core_templates.keys()];
    }

    public static core_template_documentation(template: string) {
        try {
            return this.__core_templates.get(template).documentation;
        } catch (e) {
            return "";
        }
    }

    public static core_template_predicates(template: string) {
        try {
            return this.__core_templates.get(template).predicates;
        } catch (e) {
            return [];
        }
    }

    public static core_template_program(template: string) {
        try {
            return this.__core_templates.get(template).program;
        } catch (e) {
            return [];
        }
    }
}