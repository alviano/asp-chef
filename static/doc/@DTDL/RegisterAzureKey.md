The **@DTDL/Register Azure Key** operation stores Azure Active Directory credentials in the browser so that subsequent **@DTDL** operations can authenticate against Azure Digital Twins.

The credentials are never sent to the asp-chef server — they are stored locally in the browser and used only to obtain an OAuth2 access token from Microsoft's login endpoint (`login.microsoftonline.com`) and to call your Azure Digital Twins instance directly.

The following fields are required:

- **Tenant ID**: the Directory (tenant) ID of your Azure AD tenant (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
- **Client ID**: the Application (client) ID of the registered app in Azure AD.
- **Client Secret**: the client secret value created for the app registration.

Two storage options are available:

- **Enable for this session only**: credentials are written to `sessionStorage` and cleared when the browser tab is closed.
- **Enable and register permanently (Local Storage)**: credentials are written to both `sessionStorage` and `localStorage` and persist across page reloads. Use only on a trusted personal device.

The access token is obtained via the OAuth2 `client_credentials` flow and cached in memory with a 60-second expiry buffer. No token is stored in `sessionStorage` or `localStorage`.

The input is passed through unchanged; the operation produces no output facts.

§§§§

Place **@DTDL/Register Azure Key** at the start of the pipeline, before **@DTDL/Config**:

```
@DTDL/Register Azure Key → @DTDL/Config → [@DTDL/Parse →] @DTDL/Instances
```

Click the **ⓘ** icon next to the Client Secret field for step-by-step instructions on how to:

1. Create an Azure Digital Twins instance and note its hostname.
2. Register an application in Azure AD and copy its **Client ID** and **Tenant ID**.
3. Create a client secret and copy its **Value** immediately (shown only once).
4. Assign the **Azure Digital Twins Data Owner** (read + write) or **Azure Digital Twins Data Reader** (read only) role to the registered app on the ADT resource.

Once credentials are registered you do not need to repeat this step on subsequent visits if you chose permanent storage. If authentication fails, re-enter the credentials — the client secret may have expired.
