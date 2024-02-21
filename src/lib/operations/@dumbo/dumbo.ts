import {Utils} from "$lib/utils";
import {Base64} from "js-base64";
import {get} from "svelte/store";
import {server_url} from "$lib/stores";

export class Dumbo {
    public static get PREDICATE() {
        return "__dumbo__";
    }

    public static validate_one_model(input) {
        if (input.length !== 1) {
            throw new Error("Expecting one model, not " + input.length);
        }
    }

    public static encode_program(program, predicate) {
        const encoded_term = Base64.encode(program);
        return Utils.parse_atom(`${predicate}("${encoded_term}")`);
    }

    public static async fetch(url, data, ) {
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
}