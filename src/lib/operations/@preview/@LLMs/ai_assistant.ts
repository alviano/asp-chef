import { Utils } from "$lib/utils";
import { Option, Recipe } from "$lib/recipe";

export const AIAssistantUtils = {
    systemPrompt: `
You are the "ASP Chef Sous-Chef," a technical assistant for ASP Chef.
Your goal is to assist users in building, debugging, and optimizing their ASP pipelines (Recipes).

Recipes are made of ingredients performing several kind of operations.
Every operation manipulates sets of facts, and arbitrary content is Base64-encoded.
For example, Search Models is used to solve combinatorial problems (full ASP) or to transform atoms (Datalog).

A portion of the recipe is provided in the user message.
The input of the recipe is not provided automatically, but can be fetched.

### ROLE & MISSION
You are a Pipeline Architect and Debugger. You analyze the recipe context and input data to:
1. Explain the logic of current operations.
2. Identify errors or mismatches in data flow between steps.
3. Suggest improvements or new operations to achieve specific goals.

### OPERATIONAL PROTOCOL
1. Tools:
   - Read input: \`SYSTEM: INPUT: <start>-<end>\` (Fetch a snippet of input).
   - Catalog: \`SYSTEM: OPERATIONS: LIST\` (Get a list of available operations).
   - Specs: \`SYSTEM: DOC: <OpName1>, <OpName2>\` (Fetch technical documentation).

2. Guidelines:
   - NEVER guess parameters. If an operation is unknown or complex, fetch its documentation.
   - If you need the Input of the recipe, use the appropriate tool.
   - Be technical and precise.
   - When suggesting new steps, use the exact name from the operation list.
   - Use Markdown code snippets for code fragments.
   
### OUTPUT DISCIPLINE (STRICT)
   - Tool-First: If you decide to call a 'SYSTEM:' command, that MUST be the ONLY content of your response. Do not add conversational text, explanations, or "Here is the documentation" prefixes.
   - Stop Sequence: Your message is complete the moment the 'SYSTEM:' command is written. Don't write additional content.
    `.trim(),

    parseMessage(content: string) {
        const parts = [];
        let remaining = content;

        while (remaining.length > 0) {
            const thinkStart = remaining.indexOf('<think>');
            if (thinkStart === -1) {
                parts.push({ type: 'text', content: remaining });
                break;
            }

            if (thinkStart > 0) {
                parts.push({ type: 'text', content: remaining.slice(0, thinkStart) });
            }

            const thinkEnd = remaining.indexOf('</think>', thinkStart + 7);
            if (thinkEnd === -1) {
                parts.push({
                    type: 'thought',
                    content: remaining.slice(thinkStart + 7),
                    isOpen: true
                });
                break;
            } else {
                parts.push({
                    type: 'thought',
                    content: remaining.slice(thinkStart + 7, thinkEnd),
                    isOpen: false
                });
                remaining = remaining.slice(thinkEnd + 8);
            }
        }

        return parts;
    },

    async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            Utils.snackbar('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    },

    common_extra_options() {
        return {
            system_prompt: Option(
                AIAssistantUtils.systemPrompt,
                'System prompt for the LLM',
                'string'
            ),
            height: Option(600, 'Height of the chat container (px)', 'number'),
            temperature: Option(0.7, 'Temperature (0-100 scale)', 'number'),
            max_tokens: Option(1024, 'Maximum output tokens', 'number'),
            context_ingredients: Option(
                0,
                'Number of previous operations to include as context (0 for all)',
                'number'
            )
        };
    },

    common_logic(messages, userInput, isGenerating, interactionCount, generate_response) {
        return {
            editMessage(index) {
                return {
                    editingIndex: index,
                    editingContent: messages[index].content
                };
            },

            deleteMessage(index, editingIndex) {
                const newMessages = messages.filter((_, i) => i !== index);
                let newEditingIndex = editingIndex;
                if (editingIndex === index) {
                    newEditingIndex = -1;
                } else if (editingIndex > index) {
                    newEditingIndex--;
                }
                return {
                    messages: newMessages,
                    editingIndex: newEditingIndex,
                    editingContent:
                        newEditingIndex === -1 ? '' : newMessages[newEditingIndex].content
                };
            },

            saveEdit(editingIndex, editingContent) {
                if (editingIndex === -1) return { messages };
                const newMessages = messages.slice(0, editingIndex + 1);
                newMessages[editingIndex] = {
                    ...newMessages[editingIndex],
                    content: editingContent
                };
                return {
                    messages: newMessages,
                    editingIndex: -1,
                    editingContent: ''
                };
            },

            async send_message() {
                if (!userInput.trim() || isGenerating) return null;
                const newMessages = [...messages, { role: 'user', content: userInput.trim() }];
                return {
                    messages: newMessages,
                    userInput: '',
                    interactionCount: 0
                };
            },

            prepareContext(options, index) {
                const numIngredients =
                    options.context_ingredients === 0
                        ? index
                        : Math.min(options.context_ingredients, index);
                return numIngredients > 0
                    ? Recipe.ingredients_to_yaml(index - numIngredients, numIngredients)
                    : '';
            }
        };
    },

    async fetchDocumentation(operationNames: string) {
        const names = operationNames
            .split(',')
            .map((n) => n.trim())
            .filter((n) => n.length > 0)
            .map((n) => n.replace(/^[`"']|[`"']$/g, '').replace(/[^\w@\/].*$/, ''));

        return await Promise.all(
            names.map(async (name) => {
                try {
                    const documentation = await Recipe.operation_doc(name, false, true, true);
                    return { name, documentation, found: true };
                } catch (e) {
                    return { name, documentation: null, found: false };
                }
            })
        );
    },

    async handleDocRequests(content: string, interactionCount: number) {
        const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
        const docMatches = [
            ...cleanedContent.matchAll(
                /(?:SYSTEM:\s*)?DOC:\s*([@\/\w\s\.\-,\+]+?)(?=\s*(?:SYSTEM:|$|\n|---))/gi
            )
        ];
        if (docMatches.length === 0) return null;

        const newInteractionCount = interactionCount + 1;
        if (newInteractionCount > 3) {
            const confirmContinue = await new Promise((resolve) => {
                Utils.confirm({
                    message: `The assistant has performed ${newInteractionCount - 1} autonomous research steps. Continue?`,
                    onconfirm: () => resolve(true),
                    oncancel: () => resolve(false)
                });
            });
            if (!confirmContinue) return { stop: true };
        }

        let systemContent = '';
        for (const match of docMatches) {
            const operationNames = match[1].trim();
            const results = await this.fetchDocumentation(operationNames);
            for (const res of results) {
                if (res.found) {
                    systemContent += `SYSTEM: Documentation for "${res.name}":\n\n${res.documentation}\n\n`;
                } else {
                    systemContent += `SYSTEM: Documentation for "${res.name}" not found.\n\n`;
                }
            }
        }

        return {
            interactionCount: newInteractionCount,
            systemMessage: {
                role: 'user',
                content: systemContent.trim(),
                collapsed: true
            }
        };
    },

    async handleInputRequests(content: string, input: string, interactionCount: number) {
        const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
        const inputMatches = [...cleanedContent.matchAll(/(?:SYSTEM:\s*)?INPUT:\s*(\d+)-(\d+)/gi)];
        if (inputMatches.length === 0) return null;

        const newInteractionCount = interactionCount + 1;
        if (newInteractionCount > 3) {
            const confirmContinue = await new Promise((resolve) => {
                Utils.confirm({
                    message: `The assistant has performed ${newInteractionCount - 1} autonomous research steps. Continue?`,
                    onconfirm: () => resolve(true),
                    oncancel: () => resolve(false)
                });
            });
            if (!confirmContinue) return { stop: true };
        }

        let systemContent = '';
        for (const match of inputMatches) {
            const start = Math.max(0, parseInt(match[1]) - 1);
            const end = parseInt(match[2]);

            const lines = input.split('\n');
            const to = Math.min(end, lines.length);
            systemContent += `SYSTEM: Input lines ${start + 1} to ${to}:\n\n${lines.slice(start, to).join('\n')}\n\n`;
        }

        return {
            interactionCount: newInteractionCount,
            systemMessage: {
                role: 'user',
                content: systemContent.trim(),
                collapsed: true
            }
        };
    },

    async handleOperationsListRequest(content: string, interactionCount: number) {
        const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
        if (!cleanedContent.match(/(?:SYSTEM:\s*)?OPERATIONS:\s*LIST/gi)) return null;

        const newInteractionCount = interactionCount + 1;
        if (newInteractionCount > 3) {
            const confirmContinue = await new Promise((resolve) => {
                Utils.confirm({
                    message: `The assistant has performed ${newInteractionCount - 1} autonomous research steps. Continue?`,
                    onconfirm: () => resolve(true),
                    oncancel: () => resolve(false)
                });
            });
            if (!confirmContinue) return { stop: true };
        }

        const operations = Recipe.operations('');
        const systemContent = `SYSTEM: Available Operations:\n\n${operations.join(', ')}\n\nIMPORTANT: Do NOT request documentation for all operations. Only request DOC for 1 or 2 operations that are strictly necessary for the current task.`;

        return {
            interactionCount: newInteractionCount,
            systemMessage: {
                role: 'user',
                content: systemContent,
                collapsed: true
            }
        };
    }
};
