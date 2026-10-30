/**
 * Readable names for display only. ASP: per-rule X1… (UUID `X`+hex or `V'…'`).
 * MiniZinc: generators → x1…; globals follow record/attribute paths (sdl-exp rules).
 */

export type SdlDisplayTarget = 'asp' | 'minizinc';

const ASP = /V(?:'+\w+)+|\bX[a-fA-F0-9]{32}\b/g;
const GENERATOR = /\b(x_\w+?_\d+) in /g;
const IDENTIFIER = /[A-Za-z_]\w*/g;
const GLOBAL = /\b[rx]_\w+/g;
const STRING = /"(?:[^"\\]|\\.)*"/g;
const RECORD_LEN = /\bint: r_(\w+)_len\b/g;
const GUESS = /^x_g_\d+$/;

const RESERVED = new Set([
	'ann', 'annotation', 'any', 'array', 'bool', 'case', 'constraint', 'default', 'diff', 'div',
	'else', 'elseif', 'endif', 'enum', 'false', 'float', 'function', 'if', 'in', 'include', 'int',
	'intersect', 'let', 'list', 'maximize', 'minimize', 'mod', 'not', 'of', 'op', 'opt', 'output',
	'par', 'predicate', 'record', 'satisfy', 'set', 'solve', 'string', 'subset', 'superset',
	'symdiff', 'test', 'then', 'true', 'tuple', 'type', 'union', 'var', 'where', 'xor', 'abs',
	'bool2int', 'card', 'concat', 'count', 'exists', 'fix', 'forall', 'index_set', 'join',
	'length', 'max', 'min', 'product', 'show', 'sum'
]);

const lowerFirst = (s: string) => s[0].toLowerCase() + s.slice(1);
const uniq = <T>(xs: Iterable<T>) => [...new Set(xs)];

const findAll = (re: RegExp, text: string): string[] => {
	const out: string[] = [];
	re.lastIndex = 0;
	for (let m = re.exec(text); m; m = re.exec(text)) out.push(m[1] ?? m[0]);
	return out;
};

/** Replace whole names outside string literals. */
const substitute = (text: string, mapping: Record<string, string>): string => {
	const keys = Object.keys(mapping);
	if (!keys.length) return text;
	const names = keys
		.sort((a, b) => b.length - a.length)
		.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('|');
	return text.replace(
		new RegExp(`"(?:[^"\\\\]|\\\\.)*"|(?:${names})(?![\\w'])`, 'g'),
		(m) => mapping[m] ?? m
	);
};

const rename = (line: string, names: string[], prefix: string): string => {
	const taken = new Set(findAll(IDENTIFIER, line.replace(STRING, '')));
	const mapping: Record<string, string> = {};
	let n = 0;
	for (const name of names) {
		n += 1;
		while (taken.has(`${prefix}${n}`)) n += 1;
		mapping[name] = `${prefix}${n}`;
	}
	return substitute(line, mapping);
};

const baseName = (
	name: string,
	records: Set<string>,
	guesses: Record<string, number>
): string => {
	if (name in guesses) return `g${guesses[name]}`;
	const body = name.slice(2);
	if (name.startsWith('x_')) {
		if (body.startsWith('rank_') && body !== 'rank_') return `rank_${lowerFirst(body.slice(5))}`;
		if (body.startsWith('penalty_') && body !== 'penalty_') return `penalty${body.slice(8)}`;
		if (body.endsWith('_text') && records.has(body.slice(0, -5))) {
			return `${lowerFirst(body.slice(0, -5))}_text`;
		}
		return body;
	}
	const record = [...records]
		.filter((r) => body === r || body.startsWith(r + '_'))
		.sort((a, b) => b.length - a.length)[0];
	if (!record) return name;
	const rest = body.slice(record.length);
	return lowerFirst(record) + (rest === '_len' ? '_n' : rest);
};

const globals = (code: string): Record<string, string> => {
	const generators = new Set(findAll(GENERATOR, code));
	const names = uniq(findAll(GLOBAL, code.replace(STRING, '')).filter((n) => !generators.has(n)));
	const records = new Set(findAll(RECORD_LEN, code));
	const guesses: Record<string, number> = {};
	let gi = 0;
	for (const n of names) if (GUESS.test(n)) guesses[n] = ++gi;
	const taken = new Set([
		...findAll(IDENTIFIER, code.replace(STRING, '')).filter((id) => !names.includes(id)),
		...RESERVED
	]);
	const mapping: Record<string, string> = {};
	for (const name of names) {
		const base = baseName(name, records, guesses);
		let candidate = base;
		let n = 1;
		while (taken.has(candidate)) candidate = `${base}${++n}`;
		taken.add(candidate);
		mapping[name] = candidate;
	}
	return mapping;
};

export function readable(code: string, target: SdlDisplayTarget): string {
	let text = code;
	if (target === 'minizinc') {
		const generators = new Set(findAll(GENERATOR, text));
		text = substitute(
			text,
			Object.fromEntries(Object.entries(globals(text)).filter(([k]) => !generators.has(k)))
		);
	}
	return text.split(/(?<=\n)/).map((line) =>
		target === 'asp'
			? rename(line, uniq(findAll(ASP, line)), 'X')
			: rename(line, uniq(findAll(GENERATOR, line)), 'x')
	).join('');
}
