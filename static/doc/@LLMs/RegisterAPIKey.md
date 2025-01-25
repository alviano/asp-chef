The **@LLMs/Register API Key** operation gives the possibility to register API keys to access servers providing LLMs services.

You can include this ingredient in a recipe to ease the registration of the API key for a specific server, or put it in an ad-hoc recipe to configure the browser of your users.

The API key is not saved in the recipe, but in the session storage.
It is accessible only in the current tab of the browser.

It can be saved in the local storage of the browser to be retrieved in the future.
In this case, if a recipe in a different session tries to access the API key, the user will be asked to enable the key before using it.

API keys can be removed using the **@LLMs/Unregister API Keys**.