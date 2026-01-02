import {default as peg} from 'pegjs';
import {consts} from '$lib/consts';
import {DOMPurifyConfig, Utils as BaseUtils} from "dumbo-svelte";
import _ from 'lodash';
import AsyncLock from "async-lock";
// import {run} from 'clingo-wasm'
import ClingoWorker from '$lib/clingo.worker?worker';
import JavascriptWorker from '$lib/javascript.worker?worker';
import {clingo_remote_on, clingo_remote_uuid, processing_index, server_url} from "$lib/stores";
import {get} from "svelte/store";
import {Base64} from "js-base64";
import {v4 as uuidv4} from 'uuid';
import { toJson } from 'really-relaxed-json';
import { JSONPath } from "jsonpath-plus";

const dom_purify_config = new DOMPurifyConfig(consts);

const originalConsole = {
    uuid: 'a9162e31-3e85-4736-a548-98f38b7bb25e',
    log: console.log,
    warn: console.warn,
    error: console.error,
};

export class Utils extends BaseUtils {
    private static _clingo_timeout = 5;
    private static _clingo_reject = null;
    private static _clingo_lock = new AsyncLock();
    private static _clingo_options = new Map();
    private static _clingo_worker = null;
    private static _browser_cache_policy: RequestCache = "default";
    private static _worker = null;

    private static _BROWSER_CACHE_POLICY_VALUES = {
        "default" : "Use cache if fresh, otherwise ask for changes",
        "no-store" : "Don't use or update cache",
        "reload" : "Don't use cache, but update it",
        "no-cache" : "Ask for changes",
        "force-cache" : "Use cache if available",
        "only-if-cached" : "Use cache if available, otherwise error",
    };

    static get browser_cache_policy_values() {
        return {...this._BROWSER_CACHE_POLICY_VALUES}
    }

    static get browser_cache_policy() {
        return this._browser_cache_policy;
    }

    static set browser_cache_policy(value: RequestCache) {
        if (!(value in this._BROWSER_CACHE_POLICY_VALUES)) {
            throw new Error("Invalid value for browser cache policy");
        }
        this._browser_cache_policy = value;
    }

    static render_markdown(content: string) {
        return BaseUtils.render_markdown(content, dom_purify_config);
    }

    static render_inline_markdown(content: string) {
        return BaseUtils.render_inline_markdown(content, dom_purify_config);
    }

    static dom_purify(content: string) {
        return BaseUtils.dom_purify(content, dom_purify_config);
    }

    static add_copy_button(pre) {
        BaseUtils.add_copy_button(pre);
        pre.addEventListener("scroll", _ => {
            if (pre.scrollLeft === 0) {
                pre.classList.remove("scroll");
            } else {
                pre.classList.add("scroll");
            }
        });
    }

    static worker_terminate() {
        if (this._worker !== null) {
            this._worker.terminate();
            this._worker = null;
        }
    }

    static async worker_run(code: string, input, options) {
        this.worker_terminate();

        this._worker = new JavascriptWorker();
        let res;
        let err;
        this._worker.onmessage = (event) => {
            res = event.data.res;
            err = event.data.err;
            this.worker_terminate();
        }
        this._worker.onerror = (event) => {
            res = input;
            err = event.message;
            this.worker_terminate();
        }

        this._worker.postMessage({
            code,
            input,
            options,
        });

        while (this._worker !== null) {
            await Utils.delay(100);
        }

        if (res === undefined) {
            err = "Terminated";
        }

        if (err) {
            throw new Error(err);
        }
        return options !== "DESCRIBE" ? res.map(part => part.map(atom => Utils.parse_atom(atom.str))) : res;
    }

    static get clingo_timeout() {
        return this._clingo_timeout;
    }

    static set clingo_timeout(value: number) {
        this._clingo_timeout = value;
    }

    static reset_clingo_options() {
        this.clingo_timeout = 5;
        this._clingo_options.clear();
    }

    static reset_config() {
        this.reset_clingo_options();
        this._browser_cache_policy = 'default';
    }

    static change_clingo_option(key, value) {
        this._clingo_options.set(key, value);
    }

    static async clingo_terminate(message = 'Error: terminated.') {
        try {
            this._clingo_worker.terminate();
            this._clingo_worker = new ClingoWorker();
            if (get(clingo_remote_on)) {
                await this.__remote_clingo_terminate();
            }
        } catch (error) {
            /* empty */
        }
        try {
            this._clingo_reject(message);
        } catch (error) {
            /* empty */
        }
    }

    static async __remote_clingo(endpoint, data = {}) {
        return fetch(`${get(server_url)}/clingo/${endpoint}/`, {
            method: "POST",
            mode: "cors",
            cache: Utils.browser_cache_policy,
            credentials: "same-origin",
            headers: new Headers([["Content-Type", "application/json"]]),
            body: JSON.stringify({
                uuid: get(clingo_remote_uuid),
                ...data,
            }),
        });
    }

    static async __remote_clingo_terminate() {
        await this.__remote_clingo("terminate");
    }

    static async __remote_clingo_run(program: string, number: number, options, timeout: number) {
        const response = await this.__remote_clingo("run", {
            program,
            number,
            options,
            timeout,
        });
        return await response.json();
    }

    static async clingo_run(program: string, number = 0, options = [], timeout = null) {
        const the_timeout = timeout !== null ? timeout : this._clingo_timeout;
        return await this._clingo_lock.acquire('clingo', async () => {
            if (this._clingo_worker === null) {
                this._clingo_worker = new ClingoWorker();
            }
            return new Promise((resolve, reject) => {
                this._clingo_reject = reject;
                const timeout = setTimeout(async () => {
                    await this.clingo_terminate(`Error: TIMEOUT ${the_timeout} seconds (it can be increased with a Set Timeout ingredient)`);
                }, the_timeout * 1000);
                const the_options = [
                    ...options,
                    ...Array.from(this._clingo_options, ([key, value]) => `${key}${value}`),
                ];
                if (get(clingo_remote_on)) {
                    this.__remote_clingo_run(program, number, the_options, the_timeout).then(data => {
                        clearTimeout(timeout);
                        delete data.Input;
                        resolve(data);
                    });
                } else {
                    this._clingo_worker.onmessage = ({data}) => {
                        clearTimeout(timeout);
                        resolve(data);
                    }
                    this._clingo_worker.postMessage({
                        type: 'run', args: [program, number, the_options]
                    });
                }
            });
        });
    }

    static async search_model(program: string) {
        const result = await this.clingo_run(program);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        } else if (result.Models.Number === 0) {
            throw new Error('NO MODEL');
        } else {
            return result.Call[0].Witnesses[0].Value;
        }
    }

    static async search_models(program: string, number: number, raises: boolean, include_lua_chef_lib = false) {
        const result = await this.clingo_run(include_lua_chef_lib ? `${Utils.lua_lib()}\n${program}`: program, number);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        } else if (raises && result.Models.Number !== number) {
            throw new Error(`Expecting ${number} models, found ${result.Models.Number}`);
        } else if (result.Call[0].Witnesses) {
            return result.Call[0].Witnesses.map(witness => witness.Value);
        } else {
            return [];
        }
    }

    static async search_optimal_models(program: string, number: number, raises: boolean, cost_predicate = '') {
        const result = await this.clingo_run(program, number, [
            '--opt-mode=optN',
        ]);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        }
        const actual_number = result.Models.Optimal !== undefined ? result.Models.Optimal : result.Models.Number;
        if (raises) {
            if (actual_number !== number) {
                throw new Error(`Expecting ${number} optimal models, found ${result.Models.Optimal}`);
            }
        }
        const res = result.Call[0].Witnesses.slice(result.Call[0].Witnesses.length - actual_number)
            .map(witness => witness.Value);
        if (number !== 0) {
            while (res.length > number) {
                res.shift();
            }
        }
        if (cost_predicate && result.Models.Costs) {
            const costs = result.Models.Costs.join(',');
            const end = result.Models.Costs.length <= 1 ? "," : "";
            const cost_atom = `${cost_predicate}((${costs}${end}))`;
            res.forEach(model => model.push(cost_atom));
        }
        return res;
    }

    static async cautious_consequences(program: string) {
        const result = await this.clingo_run(program, 0, [
            '--enum-mode=cautious'
        ]);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        } else if (result.Result === 'UNSATISFIABLE') {
            throw new Error('NO MODEL');
        } else {
            return result.Call[0].Witnesses[result.Call[0].Witnesses.length - 1].Value;
        }
    }

    static async brave_consequences(program: string) {
        const result = await this.clingo_run(program, 0, [
            '--enum-mode=brave'
        ]);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        } else if (result.Result === 'UNSATISFIABLE') {
            throw new Error('NO MODEL');
        } else {
            return result.Call[0].Witnesses[result.Call[0].Witnesses.length - 1].Value;
        }
    }

    static async reify_program(program: string) {
        const result = await this.clingo_run(program, 1, ['--output=reify']);
        if (result.Result === 'ERROR') {
            throw new Error(result.Error);
        } else {
            return result.atoms.map(atom => atom.slice(0, -1));
        }
    }

    static predicates(models: string[][]) {
        const res = new Set();
        models.forEach(model => {
            model.forEach(atom => {
                res.add(atom.predicate || 'CONSTANTS');
            });
        });
        return Array.from(res).sort();
    }

    static rename_predicate(atom, predicate: string) {
        return Utils.parse_atom(atom.str.replace(atom.predicate, predicate))
    }

    static is_valid_predicate(pred: string) {
        try {
            const parsed = PARSER.parse(pred);
            return parsed.predicate === parsed.str;
        } catch (error) {
            return false;
        }
    }

    static parse_atom(atom: string) {
        return PARSER.parse(atom);
    }

    static parse_atoms(atoms: string[]) {
        return atoms.map(atom => this.parse_atom(atom));
    }

    static async parse_answer_set(atoms: string) {
        return this.parse_atoms(await this.search_model(atoms));
    }

    static flatten_output(output_value, empty_model = 'EMPTY MODEL') {
        return output_value.map(atoms =>
            atoms.length === 0 ? empty_model :
                atoms.map(atom => atom.str + '.')
                .join('\n')).join('\n' + consts.SYMBOLS.MODELS_SEPARATOR +'\n');
    }

    static keep_occurrences(input_string, regex) {
        const res = [];
        let last_index = 0;
        [...input_string.matchAll(regex)].map(match => {
            const index = match.index || 0;
            res.push(consts.SYMBOLS.MODELS_SEPARATOR.repeat(index - last_index));
            res.push(match[0]);
            last_index = index + match[0].length;
        });
        res.push(consts.SYMBOLS.MODELS_SEPARATOR.repeat(input_string.length - last_index));
        return res.join('');
    }

    static public_url_hack_md(url) {
        return consts.HACK_MD_DOMAIN + new URL(url).pathname + '/download';
    }

    static public_url_github(url, use_jsDelivr) {
        const the_url = new URL(url);
        const [_, user, repo, blob, version, file] = this.split_with_limit(the_url.pathname, '/', 6);
        if (!use_jsDelivr) {
            return `${consts.GITHUB_API_DOMAIN}/repos/${user}/${repo}/contents/${file || ''}`;
        } else if (blob === undefined) {
            return `${consts.CDN_JSDELIVER_DOMAIN}/gh/${user}/${repo}/`;
        } else {
            return `${consts.CDN_JSDELIVER_DOMAIN}/gh/${user}/${repo}@${version}/${file}`;
        }
    }

    static public_url_github_from_jsDelivr(url) {
        const the_url = new URL(url);
        const [_, __, user, repo_version, file] = this.split_with_limit(the_url.pathname, '/', 5);
        const [repo, version] = repo_version.split('@');
        return `${consts.GITHUB_DOMAIN}/${user}/${repo}/blob/${version}/${file}`;
    }

    static public_url(url) {
        if (url.startsWith(consts.HACK_MD_DOMAIN)) {
            return this.public_url_hack_md(url);
        } else if (url.startsWith(consts.GITHUB_DOMAIN)) {
            return this.public_url_github(url);
        }
        throw new Error("Unknown domain: " + url);
    }

    static split_with_limit(str: string, sep: string, limit: number) {
        const array = str.split(sep);
        if (array.length > limit) {
            const tail = array.slice(limit - 1).join(sep);
            array.splice(limit - 1);
            array.push(tail);
        }
        return array;
    }

    static check_one_term_string(atom, index) {
        if (!atom.terms || atom.terms.length !== 1) {
            Utils.snackbar(`Wrong number of terms in #${index}: ${atom.str}`)
            return false;
        } else if (atom.terms[0].string === undefined) {
            Utils.snackbar(`Wrong argument in #${index}: ${atom.str}`)
            return false
        } else {
            return true;
        }
    }

    static compare_jsons(a, b) {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a !== "object" || a === null || b === null) return false;

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;

        return keysA.every(key => this.compare_jsons(a[key], b[key]));
    }

    static async expand_mustache_queries(part, message, index, multistage = false) {
        if (!multistage) return this.__process_mustache(part, message, index);

        let current = message, previous;
        do {
            previous = current;
            current = await this.__process_mustache(part, current, index);
        } while (current !== previous);
        return current;
    }

    static async __process_mustache(part, message, index) {
        let ast;
        try {
            ast = MUSTACHE_PARSER.parse(message);
        } catch (e) {
            throw new Error(`#${index}. Parse Error: ${e.message}`);
        }

        let buffer = "";
        const persistent_atoms = [];

        for (const node of ast.body) {
            if (["Text", "Literal", "MultilineString", "FString"].includes(node.type)) {
                buffer += this.__node_to_string(node);
                continue;
            }

            if (node.type === "Reset") {
                persistent_atoms.length = 0;
                continue;
            }

            const code = this.__reconstruct_code(node.code || node.terms);
            const program = this.__build_asp_program(part, node, code);
            const models = await Utils.search_models(program, 1, true, true);

            if (models.length !== 1) throw Error(`#${index}. Expected 1 model, found ${models.length}`);

            if (node.type === "Persistent") {
                persistent_atoms.push(...models[0]);
            } else {
                const context = [...persistent_atoms, ...models[0]];
                buffer += Utils.markdown_process_match(part, context, index);
            }
        }
        return buffer;
    }

    static __node_to_string(node) {
        if (node.type === "FString") return this.__process_fstring(node);
        if (node.type === "MultilineString") return `"${node.value}"`;
        return node.value;
    }

    static __reconstruct_code(parts) {
        if (!parts) return "";
        return parts.map(p => this.__node_to_string(p)).join("");
    }

    static __process_fstring(node) {
        let format_string = "";
        const args = [];

        for (const part of node.parts) {
            switch (part.type) {
                case 'Literal':
                    format_string += part.value
                        .replaceAll('\\', '\\\\')
                        .replaceAll('"', '\\"')
                        .replaceAll('\n', '\\n');
                    break;

                case 'Variable':
                    format_string += part.format;
                    args.push(`, ${part.name}`);
                    break;

                case 'FString':
                    format_string += '%s';

                    const raw_source = this.__reconstruct_fstring(part);
                    const safe_arg = raw_source.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

                    args.push(`, "${safe_arg}"`);
                    break;
            }
        }

        return `@string_format("${format_string}"${args.join('')})`;
    }

		static __reconstruct_fstring(node) {
				let raw_content = "";

				for (const p of node.parts) {
						if (p.type === "Literal") {
								raw_content += p.value;
						} else if (p.type === "Variable") {
								const fmt = p.format === "%s" ? "" : p.format;
								raw_content += `\${${p.name}${fmt}}`;
						} else if (p.type === "FString") {
								raw_content += this.__reconstruct_fstring(p);
						}
				}

				return `{{f"${raw_content}"}}`;
	}

		static __build_asp_program(part, node, code_str) {
				const base = part.map(a => a.predicate || a.functor ? `${a.str}.` : `__const__(${a.str}).`).join('\n');
				let logic = "", show = "";

				switch (node.type) {
						case "Expression":
								const terms = this.__reconstruct_code(node.terms).trim();

								if (node.code && node.code.length > 0) {
										const body = this.__reconstruct_code(node.code).trim();
										show = `#show ${terms} : ${body}.`;
								} else {
										show = `#show ${terms}.`;
								}
								break;

						case "Persistent":
								show = `#show ${code_str.trim()}.`;
								break;

						default:
								logic = code_str.trim();
				}

				return `${base}\n#show.\n${logic}\n${show}`;
		}

    static markdown_process_match(part, query_answer, index) {
        const output_predicates = [
            'base64', 'qrcode', 'png', 'gif', 'jpeg', 'th', 'tr', 'ol', 'ul', 'matrix', 'tree', 'json'
        ];

        let matrix = null;
        let separator = '\n';
        let term_separator = ', ';
        let prefix = '';
        let suffix = '';
        const sort = [];

        const replacement = [];
        let output_atoms = [];
        Utils.parse_atoms(query_answer).forEach(atom => {
            if (atom.functor === undefined && atom.predicate === undefined) {
                atom.functor = '';
                atom.terms = [atom];
            }
            if (atom.functor === '' || atom.predicate === 'show' || output_predicates.includes(atom.predicate)) {
                output_atoms.push(atom);
            } else if (atom.predicate === 'prefix') {
                if (this.check_one_term_string(atom, index)) {
                    prefix = this.replace_escaped_chars(atom.terms[0].string);
                }
            } else if (atom.predicate === 'suffix') {
                if (this.check_one_term_string(atom, index)) {
                    suffix = this.replace_escaped_chars(atom.terms[0].string);
                }
            } else if (atom.predicate === 'separator') {
                if (this.check_one_term_string(atom, index)) {
                    separator = this.replace_escaped_chars(atom.terms[0].string);
                }
            } else if (atom.predicate === 'term_separator') {
                if (this.check_one_term_string(atom, index)) {
                    term_separator = this.replace_escaped_chars(atom.terms[0].string);
                }
            } else if (atom.predicate === 'sort') {
                if (atom.terms.length === 0) {
                    Utils.snackbar(`Wrong number of terms in \#${index}: ${atom.str}`);
                } else if (atom.terms.filter(term => term.number === undefined || term.number === 0).length > 0) {
                    Utils.snackbar(`Wrong term in \#${index}. Markdown: ${atom.str}`);
                } else {
                    sort.push(atom.terms.map(term => term.number));
                }
            } else {
                Utils.snackbar(`Unknown predicate in \#${index}: ${atom.predicate} - Should you try (TERM,)?`);
            }
        });
        sort.forEach(terms => {
            const comparator = terms.map(sort_index => {
                return atom => {
                    if (!atom.terms) {
                        return undefined;
                    }
                    const term = atom.terms[Math.abs(sort_index) - 1];
                    if (term === undefined) {
                        return undefined;
                    } else if (term.number !== undefined) {
                        return term.number;
                    } else {
                        return term.str;
                    }
                }
            });
            output_atoms = _.orderBy(output_atoms, comparator, terms.map(sort_index => sort_index > 0 ? "asc" : "desc"));
        });

        // handle show atoms
        output_atoms = output_atoms.map(atom => {
            if (atom.predicate !== 'show') {
                return atom;
            }
            if (atom.terms.length >= 1) {
                const term = atom.terms[0];
                if (term.functor === undefined) {
                    term.functor = '';
                    term.terms = [term];
                }
                if (term.functor === '' || output_atoms.includes(term.functor)) {
                    term.predicate = term.functor;
                    return term;
                }
            }
            Utils.snackbar(`Invalid atom in \#${index}: ${atom.str}`);
            return atom;
        });

        // handle tree atoms
        const trees = new Map();
        output_atoms = output_atoms.filter(atom => {
            if (atom.predicate !== 'tree') {
                return true;
            }
            if (atom.terms.length === 0) {
                Utils.snackbar(`Invalid atom in \#${index}: ${atom.str}`);
                return false;
            }

            const tree_id = atom.terms[0].str;
            if (!trees.has(tree_id)) {
                trees.set(tree_id, {
                    nodes: {},
                    links: {},
                    root: null,
                    children_on: "{CHILDREN}",
                    separator: ", ",
                });
            }
            if (atom.terms.length === 1) {
                return true;
            }

            const tree = trees.get(tree_id);

            let term = atom.terms[1];
            if (term.functor === 'node' && term.terms.length === 2) {
                tree.nodes[term.terms[0].str] = term.terms[1].string;
                return false;
            } else if (term.functor === 'link' && term.terms.length === 2) {
                if (!(term.terms[0].str in tree.links)) {
                    tree.links[term.terms[0].str] = [];
                }
                tree.links[term.terms[0].str].push(term.terms[1].str);
                return false;
            }
            for (let term_index = 1; term_index < atom.terms.length; term_index++) {
                term = atom.terms[term_index];
                if (term.functor === 'root' && term.terms.length === 1) {
                    tree.root = term.terms[0].str;
                } else if (term.functor === 'children_on' && term.terms.length === 1) {
                    tree.children_on = term.terms[0].string;
                } else if (term.functor === 'separator' && term.terms.length === 1) {
                    tree.separator = term.terms[0].string;
                } else {
                    Utils.snackbar(`Invalid atom in \#${index}: ${atom.str}`);
                    return false;
                }
            }
            return true;
        });

        // handle json atoms
        output_atoms = output_atoms.filter(atom => {
            if (atom.predicate !== 'json') {
                return true;
            }
            if (atom.terms.length < 2) {
                Utils.snackbar(`Invalid atom in \#${index}: ${atom.str}`);
                return false;
            }
            
            return true;
        });

        // sort atoms
        output_atoms = _.orderBy(output_atoms, [atom => {
            if (atom.predicate === 'th') {
                return 0;
            } else if (atom.predicate === 'tr') {
                return 1;
            }
        }]);

        output_atoms.forEach(atom => {
            const terms = atom.terms.map(term => term.string !== undefined ? this.replace_escaped_chars(term.string) : term.str);
            if (atom.functor === '') {
                replacement.push(prefix + terms.join(term_separator) + suffix);
            } else if (atom.predicate === 'base64') {
                replacement.push(`${prefix}${terms.map(term => Base64.decode(term)).join(term_separator)}${suffix}`);
            } else if (atom.predicate === 'tree') {
                if (atom.terms.length >= 2 && atom.terms[1].functor === 'root') {
                    const tree = trees.get(atom.terms[0].str);

                    function tree_string(node: string) {
                        const res = tree.nodes[node];
                        const replacement = !tree.links[node] || tree.links[node].length === 0 ? '' :
                            tree.links[node].map(tree_string).join(tree.separator);
                        return res.replace(tree.children_on, replacement);
                    }

                    replacement.push(`${prefix}${tree_string(tree.root)}${suffix}`);
                }
            } else if (atom.predicate === 'qrcode') {
                if (atom.terms.length !== 1) {
                    Utils.snackbar(`Wrong number of terms in #${index}. (Markdown?): ${atom.str}`);
                } else {
                    replacement.push(`${prefix}[${terms.join(term_separator)}](qrcode)${suffix}`);
                }
            } else if (atom.predicate === 'json') {
                if (atom.terms.length !== 2 && atom.terms.length !== 3) {
                    Utils.snackbar(`Wrong number of terms in #${index}. (Markdown?): ${atom.str}`);
                } else {
                    try {
                        const json_objects = JSON.parse(Base64.decode(atom.terms[0].string));
                        const result = JSONPath({ path: atom.terms[1].string, json: json_objects })[0];
                        const mapper = atom.terms.length === 2 ? res => `${res}` :
                                res => `${atom.terms[2].str}(${/^\p{Lu}/u.test(res) ? '"' + res.replaceAll('"', '\\"') + '"' : res}).`;
                        if (Array.isArray(result)) {
                            result.forEach(res => replacement.push(mapper(res)));
                        } else {
                            replacement.push(mapper(result));
                        }
                    } catch (error) {
                        Utils.snackbar(`Wrong terms in #${index}. (Markdown?): ${atom.str}\n${error}`);
                    }
                }
            } else if (atom.predicate === 'png' || atom.predicate === 'gif' || atom.predicate === 'jpeg') {
                if (atom.terms.length !== 1) {
                    Utils.snackbar(`Wrong number of terms in #${index}. Markdown: ${atom.str}`);
                } else {
                    replacement.push(`${prefix}![](data:image/${atom.predicate};base64,${terms.join(term_separator)})${suffix}`);
                }
            } else if (atom.predicate === 'th') {
                replacement.push('|' + atom.terms.map((term, index) =>
                    term.terms === undefined ? terms[index] :
                        term.terms[0].string !== undefined ? term.terms[0].string : term.terms[0].str
                ).join('|') + '|');
                replacement.push('|' + atom.terms.map((term) =>
                    term.terms === undefined ? ":-" :
                        term.functor === 'center' ? ":-:" :
                            term.functor === 'right' ? "-:" : "-"
                ).join('|') + '|');
            } else if (atom.predicate === 'tr') {
                replacement.push(`|${terms.join('|')}|`);
            } else if (atom.predicate === 'ul') {
                replacement.push(`- ${prefix}${terms.join(term_separator)}${suffix}`);
            } else if (atom.predicate === 'ol') {
                replacement.push(`1. ${prefix}${terms.join(term_separator)}${suffix}`);
            } else if (atom.predicate === 'matrix') {
                if (matrix === null) {
                    matrix = [];
                }
                if (atom.terms.length < 3) {
                    Utils.snackbar(`Wrong number of terms in #${index}. Markdown: ${atom.str}`)
                } else {
                    const row = atom.terms[0].number;
                    const col = atom.terms[1].number;
                    const value = prefix + terms.slice(2).join(term_separator) + suffix;

                    while (matrix.length <= row) {
                        matrix.push([]);
                    }
                    while (matrix[row].length < col) {
                        matrix[row].push("");
                    }
                    while (matrix[0].length < col) {
                        matrix[0].push("");
                    }

                    matrix[row][col-1] = value;
                }
            }
        });
        if (matrix !== null) {
            replacement.push(matrix.map((row, index) => {
                let res = "|" + row.join("|") + "|";
                if (index === 0) {
                    res += "\n|" + row.map(() => "-").join("|") + "|";
                }
                return res;
            }).join("\n"));
        }
        return replacement.join(separator);
    }

    static replace_escaped_chars(str: string) {
        return str.replaceAll("\\n", "\n").replaceAll("\\r", "\t").replaceAll("\\t", "\t").replaceAll("\\\"", "\"").replaceAll("\\\\", "\\");
    }

    static uuid() {
        return uuidv4().replaceAll('-', '_');
    }

    static parse_relaxed_json(str: string) {
        return JSON.parse(toJson(str));
    }

    static lua_lib() {
        return [
            this.lua_lib_string(),
            this.lua_lib_expression(),
        ].join('\n\n');
    }

    static lua_lib_string(prefix = "string_") {
        return `
#script (lua)

local function __unpack(...)
  local args = {...}
  for i = 1, select("#", ...) do
    if args[i].type == clingo.SymbolType.Number then
      args[i] = args[i].number
    elseif args[i].type == clingo.SymbolType.String then
      args[i] = args[i].string
    elseif args[i].type == clingo.SymbolType.Function and args[i].name == "real" and #args[i].arguments == 1 and args[i].arguments[1].type == clingo.SymbolType.String then
      args[i] = tonumber(args[i].arguments[1].string)
    else
      args[i] = tostring(args[i])
    end
  end
  return table.unpack(args)
end


function ${prefix}join(sep, ...)
  local args = {__unpack(...)}
  local res = ""
  for i = 1, select("#", ...) do
    if i == 1 then
      res = res .. args[i]
    else
      res = res .. sep.string .. args[i]
    end
  end
  return res
end

function ${prefix}concat(...)
  return ${prefix}join(clingo.String(""), ...)
end

function ${prefix}byte(s, i)
  return string.byte(s.string, i.number)
end

function ${prefix}char(...)
  return string.char(__unpack(...))
end

function ${prefix}find(s, p, i)
  return string.find(s.string, p.string, i.number)
end

function ${prefix}format(fs, ...)
  return string.format(fs.string, __unpack(...))
end

function ${prefix}gmatch(s, p)
  return string.gmatch(s.string, p.string)
end

function ${prefix}gsub(s, p, r)
  return string.gsub(s.string, p.string, r.string)
end

function ${prefix}len(s)
  return string.len(s.string)
end

function ${prefix}lower(s)
  return string.lower(s.string)
end

function ${prefix}match(s, p, i)
  return string.match(s.string, p.string, i.number)
end

function ${prefix}rep(s, n)
  return string.rep(s.string, n.number)
end

function ${prefix}reverse(s)
  return string.reverse(s.string)
end

function ${prefix}sub(s, i, j)
  return string.sub(s.string, i.number, j.number)
end

function ${prefix}upper(s)
  return string.upper(s.string)
end

function ${prefix}double_quote(s)
  return string.format("\\"%s\\"", string.gsub(s.string,"\\"","\\\\\\""))
end

function ${prefix}tostring(value)
  return tostring(value)
end

function ${prefix}tonumber(s, base)
  base = base or clingo.Number(10)
  return tonumber(s.string, base.number)
end

#end.
        `.trim();
    }

    static lua_lib_expression(prefix = "expr") {
        return `
#script (lua)

local function __unpack(...)
  local args = {...}
  for i = 1, select("#", ...) do
    if args[i].type == clingo.SymbolType.Number then
      args[i] = args[i].number
    elseif args[i].type == clingo.SymbolType.String then
      args[i] = args[i].string
    elseif args[i].type == clingo.SymbolType.Function and args[i].name == "real" and #args[i].arguments == 1 and args[i].arguments[1].type == clingo.SymbolType.String then
      args[i] = tonumber(args[i].arguments[1].string)
    else
      args[i] = tostring(args[i])
    end
  end
  return table.unpack(args)
end

local function __expr(expression)
  local sandbox_env = {
    tonumber = tonumber,
    tostring = tostring,
    math = math,
    string = string,
  }

  -- Load the code with the restricted environment
  local code = "return " .. expression
  local func, err = load(code, "sandbox_code", "t", sandbox_env)
  if not func then
    error(err)
  end

  local res = func()
  if type(res) == "number" then
    if res % 1 == 0 then
      return res
    end
    return clingo.Function("real", {tostring(res)})
  elseif type(res) == "boolean" then
    return clingo.Function(tostring(res))
  end
  return tostring(res)
end


function ${prefix}(...)
  return __expr(${prefix}_string(...))
end

function ${prefix}_string(...)
  local args = {__unpack(...)}
  local expression = ""
  for i = 1, select("#", ...) do
    expression = expression .. args[i]
  end
  return expression
end

function ${prefix}f(format, ...)
  return __expr(${prefix}f_string(format, ...))
end

function ${prefix}f_string(format, ...)
  return string.format(format.string, __unpack(...))
end

#end.
        `.trim();
    }

    static capture_log() {
        // if already called, return immediately
        if (console.uuid === originalConsole.uuid) {
            return;
        }
        console.uuid = originalConsole.uuid;

        window.onerror = function(message, source, lineno, colno, error) {
            console.error(`Global Error Caught: ${message}`, {message, source, lineno, colno, error});
            return true;
        };
        window.onunhandledrejection = function(event) {
            console.error("Unhandled Promise Rejection:", event.reason);
        };

        let log_where = -1;
        processing_index.subscribe((value) => log_where = value + 1);

        function formatArgs(args) {
            if (args.length === 0) return [];

            let output = [];
            let styles = [''];
            let mainString = args[0]; // Base string
            let argIndex = 1; // Track argument position

            if (typeof mainString !== "string") {
                return args.map(arg => ({ text: JSON.stringify(arg, null, 2), style: "" }));
            }

            let formattedString = mainString.replace(/%([sdfoOc])/sg, (match, specifier) => {
                if (argIndex >= args.length) return match; // No corresponding argument

                let replacement;
                switch (specifier) {
                    case "s": replacement = String(args[argIndex]); break;
                    case "d": replacement = parseInt(args[argIndex]); break;
                    case "f": replacement = parseFloat(args[argIndex]).toFixed(2); break;
                    case "o": replacement = args[argIndex].outerHTML || "[DOM Element]"; break;
                    case "O": replacement = JSON.stringify(args[argIndex], null, 2); break;
                    case "c": styles.push(args[argIndex]); argIndex++; return "%c";
                    default: replacement = args[argIndex];
                }
                argIndex++;
                return replacement;
            });

            let parts = formattedString.split('%c');
            let styleIndex = 0;

            parts.forEach(part => {
                output.push({ text: part, style: styles[styleIndex++] || "" });
            });

            return output;
        }

        function logToPage(type, ...args) {
            const formattedMessages = formatArgs(args);
            const logEntry = document.createElement("div");
            formattedMessages.forEach(({ text, style }) => {
                const span = document.createElement("span");
                span.textContent = text;
                if (style) span.style = style;
                logEntry.appendChild(span);
            });

            Utils.snackbar(`${type.toUpperCase()} - #${log_where}`, {
                body: logEntry.outerHTML,
                html_body: true,
                position: "is-bottom-left",
                color: type === "warn" ? "warning" :
                    type === "error" ? "danger" : "info",
            });
        }

        // Override console methods
        console.log = (...args) => {
            originalConsole.log(...args);
            logToPage("log", ...args);
            originalConsole.log(Error().stack)
        };

        console.warn = (...args) => {
            originalConsole.warn(...args);
            logToPage("warn", ...args);
        };

        console.error = (...args) => {
            originalConsole.error(...args);
            logToPage("error", ...args);
        };
    }
}

const GRAMMAR = `
$
= atom
/ '-' the_atom:atom { const res = { strongly_negated: true, ...the_atom }; res.str = '-' + res.str; return res; }
/ term

atom
= pred:string_id args:(space? "(" space? t:terms space? ")" space? { return t; })? { return { predicate : pred, terms : args !== null ? args : [], str : args !== null ? pred + '(' + args.map(term => term.str).join(',') + ')' : pred }; }

terms
= start_terms:(the_term:term space? "," space? { return the_term; })* last_term:term { start_terms.push(last_term); return start_terms; }

term
= functor:string_id args:(space? "(" space? t:terms space? ")" space? { return t; })? { return { functor : functor, terms : args !== null ? args : [], str : args !== null ? functor + '(' + args.map(term => term.str).join(',') + ')' : functor }; }
/ functor:string_id { return { functor : functor, str : functor }; }
/ the_string:quoted_string { return { string : the_string, str : '"' + the_string + '"' }; }
/ the_number:number { return { number : the_number, str : '' + the_number }; }
/ "(" space? args:terms space? ")" { return { functor : '', terms : args, str : '(' + args.map(term => term.str).join(',') + ')' }; }
/ "(" space? the_term:term space? "," space? ")" { return { functor : '', terms : [the_term], str : '(' + the_term.str + ',)' }; }
/ "(" space? "," space? ")" { return { functor : '', terms : [], str : '()' }; }
/ "(" space? ")" { return { functor : '', terms : [], str : '()' }; }

string_id
= prefix:[_']* head:[a-z] tail:[A-Za-z0-9'_]* { return prefix.join("") + head + tail.join(""); }

quoted_string
= '"' str:('\\\\"' / [^"${consts.SYMBOLS.MODELS_SEPARATOR}])* '"' { return str.join(""); }

number
= str:[0-9]+ { return parseInt(str.join("")); }
/ '-' str:[0-9]+ { return -parseInt(str.join("")); }

space
= [ \\t\\n]+
`;
const PARSER = peg.generate(GRAMMAR);

const MUSTACHE_GRAMMAR = `
Start
  = content:RecursiveContent { return { type: "Program", body: content } }

RecursiveContent
  = head:Content tail:RecursiveContent? { 
      return [head, ...(tail || [])]; 
  }

Content
  = MustacheReset
  / FString
  / MultilineString
  / MustacheExpression
  / MustachePersistent
  / MustacheQuery
  / LiteralContent
  
MustacheReset
  = "{{-}}" { return { type: "Reset" } }

MustachePersistent
  = "{{" mode:[*+] _ asp:AspContent "}}" { 
      return { type: "Persistent", mode: mode, code: asp } 
  }

MustacheExpression
  = "{{=" _ left:MustacheTerms _ ":"? _ right:AspContent? "}}" { 
      return { type: "Expression", terms: left, code: right } 
  }

MustacheQuery
  = "{{" _ asp:AspContent _ "}}" { 
      return { type: "Query", code: asp } 
  }

MustacheTerms
  = parts:(FString / MultilineString / QuotedString / TermText)* { return parts }

AspContent
  = parts:(MultilineString / AspText)* { return parts }

QuotedString
  = val:$('"' ('\\\\' . / !'"' .)* '"') { return { type: "Text", value: val } }
  / val:$("'" ('\\\\' . / !"'" .)* "'") { return { type: "Text", value: val } }

TermText
  = val:$( (!":" !"}}" !"{{" !'"' !"'" .)+ ) { return { type: "Text", value: val } }

AspText
  = val:$( (!"}}" !"{{" .)+ ) { return { type: "Text", value: val } }

FString
  = "{{" 'f"' parts:FStringBody '"}}'  { return { type: "FString", parts: parts } }

FStringBody
  = parts:(FStringInterpolation / FStringLiteral / FString)* { return parts }

FStringInterpolation
  = "\${"  _ v:VarName fmt:FormatSpecifier? _ "}" {
      return { type: "Variable", name: v, format: fmt || "%s" }
  }

FStringLiteral
  = val:$( (!"\${" !'"}}' !'{{f"' .)+ ) { return { type: "Literal", value: val } }

VarName 
  = name:$([^:}]+) { return name.trim() }

FormatSpecifier 
  = ":" fmt:$([%a-zA-Z0-9.]+) { return fmt }

MultilineString
  = "{{" '"' val:$( (!'"}}'  .)* ) '"}}'  { return { type: "MultilineString", value: val } }

LiteralContent
  = val:$( (!"{{" .)+ ) { return { type: "Text", value: val } }

_ = [ \\t\\n\\r]*
`;

const MUSTACHE_PARSER = peg.generate(MUSTACHE_GRAMMAR);

