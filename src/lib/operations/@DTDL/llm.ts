// // npm install @azure/digital-twins-core @azure/identity @langchain/anthropic @langchain/community @langchain/core @langchain/groq @langchain/langgraph @langchain/openai @types/nearley ajv ajv-formats

// import { ChatGroq } from '@langchain/groq';
// import {
// 	SystemMessagePromptTemplate,
// 	HumanMessagePromptTemplate,
// 	ChatPromptTemplate
// } from '@langchain/core/prompts';
// import fs from 'fs/promises';

// import { ChatOpenAI } from '@langchain/openai';
// import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// import { PromptTemplate } from '@langchain/core/prompts';
// import { RunnableSequence } from '@langchain/core/runnables';

// import { StringOutputParser } from '@langchain/core/output_parsers';
// import { z } from 'zod';

// export type LLMProvider = 'groq' | 'openai' | 'anthropic';

// export interface LLMConfig {
// 	apiKey: string | undefined;
// 	model: string | undefined;
// }

// export const LLM_CONFIGS: Record<LLMProvider, LLMConfig> = {
// 	//   groq: {
// 	//     apiKey: process?.env.GROQ_API_KEY || "",
// 	//     model: process?.env.GROQ_API_MODEL || "",
// 	//   },
// 	//   openai: {
// 	//     apiKey: process?.env.OPENAI_API_KEY || "",
// 	//     model: process?.env.OPENAI_API_MODEL || "",
// 	//   },
// 	//   anthropic: {
// 	//     apiKey: process?.env.ANTHROPIC_API_KEY || "",
// 	//     model: process?.env.ANTHROPIC_API_MODEL || "",
// 	//   },

// 	groq: {
// 		apiKey: '',
// 		model: ''
// 	},
// 	openai: {
// 		apiKey: '',
// 		model: ''
// 	},
// 	anthropic: {
// 		apiKey: '',
// 		model: ''
// 	}
// } as const;

// import { PUBLIC_API_URL } from '$env/static/public';
// // import { SECRET_API_KEY } from '$env/static/private';

// const systemTemplate = `
// PARSER RIGOROSO PER REGOLE ANSWER SET PROGRAMMING (ASP)

// REGOLE TASSATIVE DI PARSING:
// 1. Output DEVE essere JSON valido
// 2. Struttura rigida con sezioni precise
// 3. Parsing accettato SOLO per:
//    - Predicati alfanumerici
//    - Termini: variabili (maiuscole) o costanti
//    - Regole con/senza corpo
//    - Negazioni indicate da "not"

// RESTRIZIONI:
// - NO espressioni matematiche
// - NO caratteri speciali nei predicati
// - NO predicati annidati
// - SOLO predicati forma: nome(termine1, termine2, ...)

// FORMATO OUTPUT OBBLIGATORIO:
// {
//   "rules": [{
//     "head": {
//       "predicate": "string",
//       "terms": ["string"]
//     },
//     "body": [{
//       "predicate": "string",
//       "terms": ["string"],
//       "negated": boolean
//     }]
//   }]
// }



// ISTRUZIONI FORMATTAZIONE OUTPUT:
// - INVIA SOLO ED ESCLUSIVAMENTE un JSON valido
// - NESSUN carattere prima di "{"
// - NESSUN carattere dopo "}"
// - NO backticks (\`\`\`)
// - NO prefissi "json"
// - NO newline o spazi aggiuntivi
// - FORMATO JSON PURO E IMMEDIATO

// ESEMPIO CORRETTO:
// {"head":{"predicate":"path","terms":["X","Y"]},"body":[...]}

// ESEMPIO NON CORRETTO:
// \`\`\`json
// {
//   "head": ...
// }

// `;

// const humanTemplate = `
// PARSE RIGOROSAMENTE QUESTO BLOCCO ASP:
// \`\`\`
// {input}
// \`\`\`

// Restituisci SOLO JSON parsed. Nessun commento.
// `;

// const sys1 = `


// PRIMARY OBJECTIVE:
// Translate Answer Set Programming (ASP) rules to valid SQL queries with absolute precision and minimal abstraction.

// CORE TRANSLATION PRINCIPLES:
// 1. LITERAL TRANSLATION MANDATE
// - Translate EXACTLY what is specified in the input
// - NO CREATIVE INTERPRETATION
// - NO ASSUMPTIONS BEYOND EXPLICIT RULES

// 2. STRUCTURAL INTEGRITY REQUIREMENTS
// - Preserve original predicate names
// - Maintain original variable relationships
// - Respect negation and logical structure

// 3. QUERY GENERATION CONSTRAINTS
// - Generate SQL that is semantically equivalent to ASP rule
// - Prefer EXISTS/NOT EXISTS for logical mappings
// - Use CREATE VIEW for rule representations

// 4. SAFETY AND VALIDATION PROTOCOLS
// - ALWAYS validate input structure before translation
// - REJECT malformed or ambiguous inputs
// - Provide EXPLICIT error messages if translation is impossible

// 5. LANGUAGE AND IMPLEMENTATION SPECIFICS
// - Target PostgreSQL SQL dialect
// - Use parameterized, injection-resistant constructions
// - Prioritize readability and standard SQL practices

// STRICT RESPONSE FORMAT:

// {
//   "status": "success|error",
//   "queries": ["SQL_QUERY_1", "SQL_QUERY_2"],
//   "warnings": ["Optional detailed warning messages"],
//   "error_details": "Specific error description if translation fails"
// }

// PROHIBITED ACTIONS:

// DO NOT invent table or column names
// DO NOT make assumptions about data types
// DO NOT modify original predicate logic
// NO hallucinated transformations

// MANDATORY VALIDATION CHECKS:

// Verify input JSON schema
// Confirm all predicates have consistent term structures
// Validate negation logic preservation
// Ensure query represents original ASP rule semantics

// COMMUNICATION PROTOCOL:

// Be EXPLICIT about translation challenges
// Provide CLEAR rationale for any translation decisions
// IMMEDIATELY report any ambiguity or potential information loss

// PERFORMANCE EXPECTATION:
// Deliver 100% accurate, deterministic SQL translation with ZERO tolerance for semantic drift.

// SE NON RIESCI AD EFFETTUARE LA TRANSFORMAZIONE RESTITUISCI OUTPUT VUOTO. 
// NON DEVI SCRIVERE O SPIEGARE NIENTE!
// `;

// const ASPRuleSchema = z.object({
// 	head: z.object({
// 		predicate: z.string(),
// 		terms: z.array(z.string())
// 	}),
// 	body: z
// 		.array(
// 			z.object({
// 				predicate: z.string(),
// 				terms: z.array(z.string()),
// 				negated: z.boolean()
// 			})
// 		)
// 		.optional()
// });

// export const createLLMClient = (provider: LLMProvider, temperature: number = 0) => {
// 	const config = LLM_CONFIGS[provider];
// 	const systemPrompt = new SystemMessage({ content: '' });

// 	const modelInstance = (() => {
// 		switch (provider) {
// 			case 'openai':
// 				return new ChatOpenAI({
// 					model: config.model,
// 					temperature
// 				});
// 			// case "anthropic":
// 			//   return new ChatAnthropic({
// 			//     modelName: config.model,
// 			//     temperature,
// 			//     maxTokens,
// 			//     anthropicApiKey: config.apiKey,
// 			//     configuration: { baseURL: config.baseUrl },
// 			//   });
// 			case 'groq':
// 			default:
// 				return new ChatGroq({
// 					model: config.model,
// 					temperature
// 				});
// 		}
// 	})();
// 	return {
// 		invoke: async (prompt: string) => {
// 			return await modelInstance.invoke([systemPrompt, new HumanMessage(prompt)]);
// 		},

// 		convertQuery: async (query) => {
// 			let chatPrompt;
// 			let systemPromptContent;

// 			try {
// 				systemPromptContent = await fs.readFile(
// 					'/home/paola/workspace/dottorato/experimental/dtdl2asp/src/lib/system.txt',
// 					{
// 						encoding: 'utf8'
// 					}
// 				);
// 			} catch (error) {
// 				console.error('Error reading system prompt:', error);
// 				throw error;
// 			}

// 			const dtSystemPrompt = SystemMessagePromptTemplate.fromTemplate(systemPromptContent);
// 			const userPromptTemplate = HumanMessagePromptTemplate.fromTemplate('{input}');

// 			chatPrompt = ChatPromptTemplate.fromMessages([dtSystemPrompt, userPromptTemplate]);

// 			try {
// 				const formattedPrompt = await chatPrompt.formatMessages({
// 					input: `
//           Context: ${query.context}
//           ASP Rule: ${query.asp}

//           Please convert this ASP rule to a Digital Twin query following the system prompt guidelines.
//           Include a brief explanation of the mapping.
//         `
// 				});

// 				const response = await modelInstance.invoke(formattedPrompt);
// 				return response.content;
// 			} catch (error) {
// 				console.error('Error converting query:', error);
// 				throw error;
// 			}
// 		},

// 		fromASPtoSQL: async (query) => {
// 			let prompt = PromptTemplate.fromTemplate(`
//         {system_prompt}
  
//         REGOLE DA PARSARE:
//         \`\`\`
//         {rule_block}
//         \`\`\`
  
//         DEVI RESTITUIRE UN Restituisci SOLO il JSON parsed. Nessun commento. Non inserire "\`". 
//         Devi restituire un json valido.
//         Non 
//       `);

// 			let chain = RunnableSequence.from([
// 				{
// 					system_prompt: () => systemTemplate,
// 					rule_block: (input: { rule_block: string }) => input.rule_block
// 				},
// 				prompt,
// 				modelInstance,
// 				new StringOutputParser()
// 			]);

// 			let prompt1 = PromptTemplate.fromTemplate(`{rule_block}`);

// 			let chain1 = RunnableSequence.from([
// 				{
// 					system_prompt: () => sys1,
// 					rule_block: (input: { rule_block: string }) => input.rule_block
// 				},
// 				prompt1,
// 				modelInstance,
// 				new StringOutputParser()
// 			]);

// 			try {
// 				const output = await chain.invoke({ rule_block: query });
// 				// console.log(output);
// 				const jsonWrapper = JSON.parse(output);

// 				const output1 = await chain1.invoke({
// 					rule_block: JSON.stringify(jsonWrapper)
// 				});
// 				console.log(output1);
// 				const jsonWrapper1 = JSON.parse(output1);

// 				return jsonWrapper1;
// 			} catch (error) {
// 				throw new Error('Parsing LLM fallito: ' + error.message);
// 			}
// 		}
// 	};
// };

// const extractJSON = (input: string) => {
// 	try {
// 		return JSON.parse(input);
// 	} catch (error) {
// 		throw new Error(`Parsing JSON fallito: ${error.message}`);
// 	}
// };
