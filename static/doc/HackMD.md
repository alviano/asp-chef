The **HackMD** operation takes a URL pointing to a public note on HackMD and fetches its content.

**Important!** The note must be _published_ or _readable by everyone_. Use **Set HTTP Cache Policy** to configure the cache policy.

The content is Base64 encoded and wrapped by the specified predicate (defaulting to `__base64__`).

The name of the unary predicate can be specified in the recipe.

The encoded content can be consumed by operations such as **Markdown** and **Search Models**.

§§§§

This operation allows you to use HackMD notes as a source for your ASP programs or documentation.

#### Public Notes

Ensure your HackMD note is set to "Public" or "Freely" (anyone can read) so that ASP-chef can fetch it. The operation performs a standard HTTP fetch in the background.

#### Usage Scenario: Shared Logic

1.  **HackMD**: Provide the URL to a note containing shared ASP rules.
2.  **Decode Input**: Transform the fetched Base64 content into facts.
3.  **Search Models**: Use those facts as the logic program.

This is a great way to collaborate on logic rules in real-time with others using HackMD's collaborative editor.

#### Caching

Fetches from HackMD are subject to the browser's cache policy. Use **Set HTTP Cache Policy** if you want to force refreshes or keep the content for longer periods.

