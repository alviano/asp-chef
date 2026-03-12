The **@LLMs/Local AI Assistant** runs a local Large Language Model directly in your browser to act as your interactive Sous-Chef.

Chat, edit prompts, and tune model parameters on the fly without needing an external API.

§§§§

The **AI Assistant** is a powerful, interactive chat interface that runs Large Language Models (LLMs) entirely within your browser using WebGL/WebGPU via the `@mlc-ai/web-llm` engine. It acts as your personal digital Sous-Chef, ready to help you brainstorm, code, or process text locally—meaning fast, private inferences with no data sent to external servers.

#### ⚙️ Kitchen Tuning (Configuration Options)

Before you start cooking up prompts, you can tune your Sous-Chef's behavior:

* **Model Selection:** Use the searchable text box to find and select official Web-LLM models, or type in your own compatible model ID.
* **Load / Reload:** Click **Load** to initialize the engine. If the browser runs out of memory or the engine crashes, the button switches to **Reload** so you can quickly restart the model without losing your settings.
* **Tune ⚙️ Panel:**
* **Temp (Temperature):** Controls creativity. Lower values (e.g., 0.2) are focused and deterministic; higher values (e.g., 0.8+) are more creative.
* **Top P:** An alternative to temperature that controls the vocabulary pool.
* **Max Tokens:** The maximum length of the AI's response.
* **Rep. Penalty:** Helps prevent the model from repeating the same words or phrases.


* **System Prompt:** Tell the AI how to act (e.g., "You are a professional Sous-Chef...").

#### 👨‍🍳 Features & Interaction

* **Smart Thought Parsing:** Many modern small models generate a reasoning process before answering. If the model outputs reasoning within `<think>` tags, the interface neatly tucks it away behind a toggleable "Show Thought" button so your main response stays clean.
* *Prompting Tip:* If you want to force the model *not* to think, try appending `/no_think` to the end of your prompt!


* **Edit History (Update & Reheat):** Made a typo, or want to branch the conversation? Click the **Edit (✎)** icon on any user message. Saving the edit will automatically trim the conversation history back to that point, letting you type a new prompt or regenerate from a clean slate.
* **Interruptible Generation:** If the AI is going off-script, hit the **STOP** button to immediately halt the stream.
* **Message Management:** Use the quick-action icons to copy raw markdown (📋) or delete specific messages (✕) from the context history.

#### 📝 Usage Notes

1. **First Time Loading:** The initial load of a new model may take a few moments as it downloads the model weights to your browser's cache. You will see a progress bar indicating the status. Subsequent loads will be nearly instant.
2. **Hardware Limits:** Because this runs locally, performance and maximum model size depend strictly on your machine's available RAM and GPU capabilities.
