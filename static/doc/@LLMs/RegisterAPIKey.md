The **@LLMs/Register API Key** operation gives the possibility to register API keys to access servers providing LLMs services.

You can include this ingredient in a recipe to ease the registration of the API key for a specific server, or put it in an ad-hoc recipe to configure the browser of your users.

The API key is not saved in the recipe, but in the session storage.
It is accessible only in the current tab of the browser.

The **@LLMs/Register API Key** operation is used to securely provide API keys for professional LLM services.

It can be saved in the local storage of the browser to be retrieved in the future.
In this case, if a recipe in a different session tries to access the API key, the user will be asked to enable the key before using it.

API keys can be removed using the **@LLMs/Unregister API Keys**.

§§§§

Security is a primary concern when dealing with LLM API keys. This operation provides a safe way to handle them within the ASP-chef environment.

#### Registration Options

1.  **Session Only**: The key is kept in the browser's memory (`sessionStorage`) and is cleared as soon as you close the tab.
2.  **Permanent (Local Storage)**: The key is encrypted and stored in `localStorage`. This allows you to reload the recipe and continue working without re-entering the key.

#### How it works

When a **@LLMs/Chat Completion** operation needs to make a call, it checks if a key is registered for the specific **Server URL** being used. If multiple keys are available, it uses the most recently enabled one.

#### Usage Tip

The API key itself is **never** included in the ASP models or the recipe share link. This ensures that you can share your recipes with others without accidentally exposing your private credentials.

