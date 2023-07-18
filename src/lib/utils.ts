import {default as peg} from 'pegjs';
import {consts} from '$lib/consts';
import {DOMPurifyConfig, Utils as BaseUtils} from "dumbo-svelte";
import _ from 'lodash';
import AsyncLock from "async-lock";
// import {run} from 'clingo-wasm'
import ClingoWorker from '$lib/clingo.worker?worker';

const dom_purify_config = new DOMPurifyConfig(consts);

export class Utils extends BaseUtils {
    private static _clingo_timeout = 5;
    private static _clingo_reject = null;
    private static _clingo_lock = new AsyncLock();
    private static _clingo_options = new Map();
    private static _clingo_worker = null;

    static render_markdown(content: string) {
        return BaseUtils.render_markdown(content, dom_purify_config)
    }

    static render_inline_markdown(content: string) {
        return BaseUtils.render_inline_markdown(content, dom_purify_config);
    }

    static dom_purify(content: string) {
        return BaseUtils.dom_purify(content, dom_purify_config);
    }

    static set clingo_timeout(value: number) {
        this._clingo_timeout = value;
    }

    static reset_clingo_options() {
        this.clingo_timeout = 5;
        this._clingo_options.clear();
    }

    static change_clingo_option(key, value) {
        this._clingo_options.set(key, value);
    }

    static async clingo_terminate(message = 'Error: terminated.') {
        try {
            this._clingo_worker.terminate();
            this._clingo_worker = new ClingoWorker();
        } catch (error) {
            /* empty */
        }
        try {
            this._clingo_reject(message);
        } catch (error) {
            /* empty */
        }
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
                    await this.clingo_terminate(`Error: TIMEOUT ${the_timeout} seconds`);
                }, the_timeout * 1000);
                this._clingo_worker.onmessage = ({data}) => {
                    clearTimeout(timeout);
                    resolve(data);
                }
                this._clingo_worker.postMessage({ type: 'run', args: [program, number, [
                    ...options,
                    ...Array.from(this._clingo_options, ([key, value]) => `${key}${value}`),
                ]]});
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

    static async search_models(program: string, number: number, raises: boolean) {
        const result = await this.clingo_run(program, number);
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
        } else if (raises && (result.Models.Optimal !== undefined ? result.Models.Optimal !== number : result.Models.Number !== number)) {
            throw new Error(`Expecting ${number} optimal models, found ${result.Models.Optimal}`);
        } else {
            const res = result.Call[0].Witnesses
                .filter(model => _.isEqual(model.Costs, result.Models.Costs))
                .map(witness => witness.Value);
            if (number !== 0) {
                while (res.length > number) {
                    res.shift();
                }
            }
            if (cost_predicate) {
                if (result.Models.Costs) {
                    res.forEach(model => model.push(`${cost_predicate}((${result.Models.Costs.join(',')},))`));
                } else {
                    res.forEach(model => model.push(`${cost_predicate}((,))`));
                }
            }
            return res;
        }
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
= prefix:[_]* head:[a-z] tail:[A-Za-z0-9_]* { return prefix.join("") + head + tail.join(""); }

quoted_string
= '"' str:('\\\\"' / [^"${consts.SYMBOLS.MODELS_SEPARATOR}])* '"' { return str.join(""); }

number
= str:[0-9]+ { return parseInt(str.join("")); }
/ '-' str:[0-9]+ { return -parseInt(str.join("")); }

space
= [ \\t\\n]+
`;
const PARSER = peg.generate(GRAMMAR);
