The **MCP Server** operation acts as a bridge between ASP Chef and external tools (like LLMs) via the Model Context Protocol (MCP).

When active, it establishes a persistent connection using Server-Sent Events (SSE) to listen for commands and continuously synchronizes the recipe state with a remote server.

The following options are available:

- **Server URL**: the base URL of the MCP-compatible server (default: `http://localhost:8000`).
- **Auto-reconnect**: if enabled, the operation automatically attempts to restore the connection if it is lost.

The input models are passed through unchanged.

§§§§

This operation turns ASP Chef into a remotely-controllable interface, enabling powerful workflows where recipe construction and modification are driven by external services or autonomous agents.

#### Python Server Implementation

To use this operation, you need a running MCP Server that understands the ASP Chef synchronization protocol. You can find the official Python implementation at:

[**ASP Chef MCP Server**](https://github.com/pit0500/asp-chef-mcp-server)

This repository contains the logic required to parse the ASP Chef state and expose it as a set of tools to your LLM.

#### Quick Start: Client Configuration

To connect an MCP-compatible client (like Claude Desktop) to your ASP Chef instance:

1.  **Setup the Server**: Clone the [Python repository](https://github.com/pit0500/asp-chef-mcp-server) and install dependencies.
2.  **Configure the Client**: Add the server to your `claude_desktop_config.json` (or equivalent configuration for your client).

**Example `claude_desktop_config.json` entry:**

```json
{
  "mcpServers": {
    "asp-chef": {
      "command": "uv",
      "args": [
        "--directory",
        "path/to/asp-chef-mcp-server",
        "run",
        "server.py"
      ]
    }
  }
}
```

#### How it works

1.  **Connection**: It connects to `${Server URL}/events` using SSE to receive JSON-based commands.
2.  **Synchronization**: Upon connection and whenever the recipe or input changes, it sends the current state (ingredients, input, global settings) to `${Server URL}/sync`.
3.  **Command Execution**: It handles remote actions such as `add_operation`, `remove_operation`, `edit_operation`, and `set_input`.

#### Placement and Protection

The position of the **MCP Server** ingredient is critical for security and stability:

-   **Visibility**: The remote server only "sees" the portion of the recipe *preceding* the **MCP Server** ingredient. It should typically be placed at the end of the section you want the external tool to manage.
-   **Protection**: To maintain a stable connection, the remote server cannot modify or remove the **MCP Server** ingredient itself or any operations following it. For example, a `remove_all_operations` command will only clear the recipe *up to* the connector.
