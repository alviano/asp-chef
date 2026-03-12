The **@LLMs/Unregister API Keys** operation gives the possibility to unregister API keys used to access servers providing LLMs services.

Servers associated with API keys saved in the local storage are listed.
They can be unregistered selectively, or in bulk.

It is also possible to disable all API keys (they will be removed from the session storage).

§§§§

Use this operation to audit and manage the API credentials stored in your browser.

#### Why Unregister?

- **Cleanup**: Remove keys for services you no longer use.
- **Security**: If you are using a public or shared computer, ensure all your keys are wiped before closing the session.
- **Rotation**: Quickly clear old keys before registering new ones.

#### Management Options

- **Disable All**: Immediately removes current keys from the active session (`sessionStorage`). They won't be usable until re-enabled from local storage or re-registered.
- **Unregister (Trash Icon)**: Permanently deletes the key definition from the browser's `localStorage`.

#### Global Context

Because keys are tied to the browser's storage and the specific Server URL, changes made here will affect all recipes that use the same LLM providers on this domain.

