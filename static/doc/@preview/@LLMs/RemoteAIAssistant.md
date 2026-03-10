The **@LLMs/Remote AI Assistant** operation connects to external Large Language Model (LLM) servers (like Groq, OpenAI, Ollama, or OpenRouter) to act as an interactive technical Sous-Chef for your ASP recipes.

Leverage powerful remote models to explain ASP logic, brainstorm rules, or document your recipe steps with contextual awareness.

§§§§

#### Remote AI Assistant

The **Remote AI Assistant** provides a sophisticated chat interface that communicates with external LLM APIs. Unlike the Local Assistant, it offloads computation to remote servers, allowing you to use high-performance models regardless of your local hardware capabilities.

##### Station Configuration (Options)

To get your Remote Sous-Chef online, configure the following settings:

* **Model ID:** Specify the exact model identifier (e.g., `llama3-70b-8192` for Groq or `gpt-4o` for OpenAI).
* **Settings ⚙️ Panel:**
    * **Server Type:** Choose from supported providers: **Groq**, **OpenAI**, **Ollama**, or **OpenRouter**.
    * **Server URL:** The base API URL (e.g., `https://api.groq.com/openai/v1`).
    * **Endpoint:** The specific API path, usually `chat/completions`.
    * **Temperature:** Controls response randomness (0-100% scale). Higher values are more creative.
    * **Max Tokens:** The maximum number of tokens in the generated response.
    * **Context Ingredients:** Specify how many previous operations in your recipe should be sent to the AI as context.

###### API Key Management
Remote services require an API key to be registered first.
1. Use the **@LLMs/Register API Key** operation to add your API key for the corresponding server URL.
2. API keys are stored in your browser's **Local Storage** or **Session Storage**.
3. For **Ollama**, if running locally without a proxy, the API key requirement is bypassed by default.

#### Features & Technical Support

##### Contextual Awareness
The assistant can "see" the ingredients (operations) higher up in your recipe.
* **Context Ingredients:**
    * If set to **0**, the assistant receives **all** preceding operations as context.
    * If greater than 0, it receives exactly that many previous steps.
* This allows it to:
    * Explain the flow of atoms between operations.
    * Debug specific logic errors in your ASP rules.
    * Suggest improvements based on the current pipeline state.

Note that the input of the recipe is not automatically included in the context.
If your request mention the input, the assistant can use the `SYSTEM: INPUT: from-to` command to obtain a snippet.

##### Autonomous Documentation (Internal Tools)
The assistant is **instructed** with a specialized **Documentation Protocol**. If it encounters an operation or option it doesn't recognize (i.e., not in its "training" or previous messages), it can autonomously request technical documentation from ASP Chef using the command: `SYSTEM: DOC: <OperationName>`.
* It can request multiple documentations at once.
* It will process these requests and incorporate the new knowledge into its final answer.
* To prevent infinite loops, the assistant will ask for confirmation after 3 consecutive autonomous research steps.

##### Thought & Reasoning
Models that support internal reasoning (like those providing `reasoning_content` or using `<think>` tags) will have their thought process neatly displayed in a toggleable **"MISE EN PLACE"** section, keeping the main chat clean.

#### Interaction Controls
* **Edit/Delete Messages:** Refine your prompts or prune the conversation history using the action icons (✏️, 🗑️).
* **Copy to Clipboard:** Quickly extract code snippets or full responses using the (📋) icon.
* **Stop Generation:** Immediately halt a streaming response if the AI is veering off-track.
* **Clear Chat:** Reset the entire conversation to start a new culinary experiment.
