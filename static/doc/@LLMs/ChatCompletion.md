The **@LLMs/Chat Completion** operation calls the chat completion endpoint of a LLMs server (e.g., https://console.groq.com/docs/api-reference#chat).

The ingredient does one call for each model in input.

Configuration parameters are obtained by a predicate (default `__llms_config__`), which can be populated by a **@LLMs/Config** ingredient.

Messages to be completed are obtained by predicates specified in the *role* options.

A role predicate must have arity one.
Arguments are Base64-encoded (e.g., they can be produced by the **Encode** operation), and can include *mustache directives* as in the **Markdown** operation.

As an alternative, messages can be also given with the facts of the form `__message__(role("content""))`.
In this case, the content is a simple double-quoted string (not Base64-encoded), and the `role` functor must be one of the accepted roles.

The order of the messages is the order in which the atoms occur in the input.

Role predicates can be echoed in the output.

The answer obtained by the LLMs server is Base64-encoded in the `__base64__/1` output predicate (a different predicate name can be specified).

Supported *Chat Completion* services:
- [Groq](https://console.groq.com/docs/api-reference#chat-create)
  - Point to https://api.groq.com/openai/v1/chat/completions
  - Get a key from https://console.groq.com/keys
- [Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion)
  - Point to http://localhost:11434/api/chat (if you have a default local installation)
  - Set anything for the key
  - Set the environment variable `OLLAMA_ORIGINS='https://asp-chef.alviano.net'` before starting Ollama (unless you are running a local version of ASP Chef)

§§§§

This operation integrates Large Language Models directly into your logic pipeline, allowing for hybrid AI systems that combine symbolic reasoning (ASP) with neural generation (LLMs).

#### Message Structure

You can provide messages in two ways:

1.  **Specialized Predicates**: Use predicates for each role (e.g., `system`, `user`, `assistant`). The terms must be Base64-encoded. This is recommended for complex prompts.
    ```asp
    __user__("V2hhdCBpcyAyICsgMiA/"). % Base64 for "What is 2 + 2 ?"
    ```
2.  **Unified Message Predicate**: Use a single predicate (default `__message__`) with a functional term:
    ```asp
    __message__(user("What is 2 + 2 ?")).
    ```

#### Template Expansion

Messages support **Mustache directives** (similar to the **Markdown** operation). This allows you to inject data from the current model directly into your prompts:
```asp
% Facts in the model
person(john). age(25).

% Prompt using mustache
__message__(user("The person {{= X : person(X) }} is {{= A : age(A) }} years old.")).
```

#### Multi-Model Processing

If the input contains multiple models, the operation performs an independent LLM call for *each* model. This is powerful for:
- Generating explanations for different stable models.
- Summarizing different possible solutions found by the solver.

#### Workflow Summary

1.  **@LLMs/Config**: Set the server, model name, and temperature.
2.  **@LLMs/Register API Key**: Securely provide your key.
3.  **Encode**: Prepare your prompt (optionally with data injection).
4.  **@LLMs/Chat Completion**: Execute the call and get the results in `__base64__`.

