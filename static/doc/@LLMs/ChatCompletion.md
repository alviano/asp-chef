The **@LLMs/Chat Completion** operation calls the chat completion endpoint of a LLMs server (e.g., https://console.groq.com/docs/api-reference#chat).

The ingredient does one call for each model in input.

Configuration parameters are obtained by a predicate (default `__llms_configuration__`), which can be populated by a **@LLMs/Config** ingredient.

Messages to be completed are obtained by predicates specified in the *Roles* options, a space-separated list of predicate names.

A role predicate must have arity one.
The role is given by the predicate name, and the content is obtained from the first argument.

Arguments are Base64-encoded (e.g., they can be produced by the **Encode** operation), and can include *mustache directives* as in the **Markdown** operation.

The order of the messages is the order in which the atoms occur in the input.

Role predicates can be echoed in the output.

The answer obtained by the LLMs server is Base64-encoded in the `__base64__/1` output predicate (a different predicate name can be specified).