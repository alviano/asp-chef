import { describe, expect, it } from 'vitest';
import { readable } from './sdlDisplay';

describe('readable asp', () => {
	it('numbers variables in order of appearance', () => {
		expect(readable("p(node(V'a1'node'id)) :- q(V'Node'id), r(V'a1'node'id).\n", 'asp')).toBe(
			'p(node(X1)) :- q(X2), r(X1).\n'
		);
	});

	it('renames dodaro/SDL UUID variables to short Xn names', () => {
		const a = 'Xda6bf2d73f7348f8b5f553313ddbbfc1';
		const b = 'X888f906f94b541d0ab9f3c9fa8dd327b';
		expect(readable(`node(${a}) :- ${a} = 1..3.\ncolor(${b}) :- ${b} = "red".\n`, 'asp')).toBe(
			'node(X1) :- X1 = 1..3.\ncolor(X1) :- X1 = "red".\n'
		);
		expect(
			readable(
				`{assign(node(${a}), color(${b})) : color(${b})} = 1 :- node(${a}).\n`,
				'asp'
			)
		).toBe('{assign(node(X1), color(X2)) : color(X2)} = 1 :- node(X1).\n');
	});

	it('skips a number already taken in the rule', () => {
		expect(readable("p(V'A'id) :- q(V'A''id), X2 > 0.\n", 'asp')).toBe('p(X1) :- q(X3), X2 > 0.\n');
	});

	it('restarts numbering in every rule', () => {
		expect(readable("p(V'x'id).\nq(V'y'id).\n", 'asp')).toBe('p(X1).\nq(X1).\n');
	});
});

describe('readable minizinc', () => {
	it('numbers generator variables', () => {
		const line =
			'constraint forall(x_k_1 in 1..r_Q_len)(exists(x_P_2 in 1..r_P_len)(r_Q_id[x_k_1] == r_P_id[x_P_2]));\n';
		expect(readable(line, 'minizinc')).toBe(
			'constraint forall(x1 in 1..r_Q_len)(exists(x2 in 1..r_P_len)(r_Q_id[x1] == r_P_id[x2]));\n'
		);
	});

	it('skips a number already taken in the statement', () => {
		const line = 'constraint exists(x_p_4 in 1..2, x_P_2 in 1..2)(x_p_4 == x_P_2 /\\ x1 > 0);\n';
		expect(readable(line, 'minizinc')).toBe(
			'constraint exists(x2 in 1..2, x3 in 1..2)(x2 == x3 /\\ x1 > 0);\n'
		);
	});

	it('renames globals after record and attribute', () => {
		const code =
			'int: r_Node_len = 2;\nint: r_Color_len = 2;\nint: r_Assign_len = 2;\n' +
			'array[1..r_Assign_len] of int: r_Assign_node_id = [1, 2];\n' +
			'array[1..r_Assign_len] of var bool: r_Assign;\n' +
			'array[1..r_Node_len] of var 1..r_Color_len: x_g_9;\n' +
			'constraint forall(x_k_3 in 1..r_Assign_len)(r_Assign[x_k_3] -> x_g_9[r_Assign_node_id[x_k_3]] > 0);\n';
		expect(readable(code, 'minizinc')).toBe(
			'int: node_n = 2;\nint: color_n = 2;\nint: assign_n = 2;\n' +
				'array[1..assign_n] of int: assign_node_id = [1, 2];\n' +
				'array[1..assign_n] of var bool: assign;\n' +
				'array[1..node_n] of var 1..color_n: g1;\n' +
				'constraint forall(x1 in 1..assign_n)(assign[x1] -> g1[assign_node_id[x1]] > 0);\n'
		);
	});

	it('suffixes a global name that is a keyword or taken', () => {
		const code = 'int: r_In_len = 1;\narray[1..r_In_len] of var bool: r_In;\nconstraint r_In[1];\n';
		expect(readable(code, 'minizinc')).toBe(
			'int: in_n = 1;\narray[1..in_n] of var bool: in2;\nconstraint in2[1];\n'
		);
	});

	it('drops other x_ prefixes', () => {
		const code =
			'int: r_P_len = 1;\narray[1..r_P_len] of var 0..0: x_rank_P;\n' +
			'var int: x_penalty_1 = 0;\nvar int: x_total_penalty = x_penalty_1;\n' +
			'array[1..1] of string: x_strings = ["a"];\narray[1..r_P_len] of string: x_P_text = ["p"];\n';
		expect(readable(code, 'minizinc')).toBe(
			'int: p_n = 1;\narray[1..p_n] of var 0..0: rank_p;\n' +
				'var int: penalty1 = 0;\nvar int: total_penalty = penalty1;\n' +
				'array[1..1] of string: strings = ["a"];\narray[1..p_n] of string: p_text = ["p"];\n'
		);
	});
});
