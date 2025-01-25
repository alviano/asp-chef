import {Utils} from "$lib/utils";

export class LLMs {
    public static STORAGE_API_KEYS_KEY() {
        return "@LLMs/API keys";
    }

    public static DEFAULT_SERVER() {
        return "https://api.groq.com/openai/v1";
    }

    private static api_keys_in_local_storage() {
        return JSON.parse(localStorage.getItem(LLMs.STORAGE_API_KEYS_KEY()) || "{}");
    }

    private static api_keys_in_session_storage() {
        return JSON.parse(sessionStorage.getItem(LLMs.STORAGE_API_KEYS_KEY()) || "{}");
    }

    public static add_api_key_in_local_storage(server, api_key) {
        const keys = LLMs.api_keys_in_local_storage();
        keys[server] = api_key;
        localStorage.setItem(LLMs.STORAGE_API_KEYS_KEY(), JSON.stringify(keys));
    }

    public static add_api_key_in_session_storage(server, api_key) {
        const keys = LLMs.api_keys_in_session_storage();
        keys[server] = api_key;
        sessionStorage.setItem(LLMs.STORAGE_API_KEYS_KEY(), JSON.stringify(keys));
    }

    public static remove_api_key_from_local_storage(server) {
        const keys = LLMs.api_keys_in_local_storage();
        keys[server] = undefined;
        localStorage.setItem(LLMs.STORAGE_API_KEYS_KEY(), JSON.stringify(keys));
    }

    public static remove_api_key_from_session_storage(server) {
        const keys = LLMs.api_keys_in_session_storage();
        keys[server] = undefined;
        sessionStorage.setItem(LLMs.STORAGE_API_KEYS_KEY(), JSON.stringify(keys));
    }

    public static access_api_key(server) {
        return new Promise((resolve, reject) => {
            const enabled_api_keys = this.api_keys_in_session_storage();
            if (Object.keys(enabled_api_keys).includes(server)) {
                resolve(enabled_api_keys[server]);
            } else {
                const api_keys = this.api_keys_in_local_storage();
                if (Object.keys(api_keys).includes(server)) {
                    Utils.confirm({
                        message: `Enable API key for ${server} (in this session)?`,
                        onconfirm: () => {
                            this.add_api_key_in_session_storage(server, api_keys[server]);
                            resolve(api_keys[server]);
                        },
                        oncancel: () => {
                            reject("Access to API key forbidden!");
                        },
                    });
                } else {
                    reject(`No API key found for this server: ${server}`);
                }
            }
        });
    }
}