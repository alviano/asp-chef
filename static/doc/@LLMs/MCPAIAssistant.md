The **MCP AI Assistant** operation acts as a bridge between ASP Chef and external tools (like LLMs) via the Model Context Protocol (MCP).

When active, it establishes a persistent connection using Server-Sent Events (SSE) to listen for commands and continuously synchronizes the recipe state with a remote server.

The following options are available:

- **Server URL**: the base URL of the MCP-compatible server (default: `http://localhost:8000`).
- **Auto-reconnect**: if enabled, the operation automatically attempts to restore the connection if it is lost.
- **Context Ingredients**: limits the number of preceding operations sent to the server as context. Set to `0` to include the entire preceding recipe.

The input models are passed through unchanged.

§§§§

This operation turns ASP Chef into a remotely-controllable interface, enabling powerful workflows where recipe construction and modification are driven by external services or autonomous agents.

#### Typical Pipeline

The **MCP AI Assistant** should typically be placed at the end of the logic chain you want an agent to manage:

```
[Static Logic] → [Fixed Data] → [MCP AI Assistant (Context=0)]
```

In this setup, an LLM connecting via MCP can see and modify all ingredients preceding the server, but cannot see or modify anything that follows it.

#### Command Execution (Tool Reference)

The operation exposes a comprehensive set of tools to the remote server. When a client issues a command, it is dispatched to the following handlers:

| Action | Description |
| :--- | :--- |
| `get_recipe` | Forces an immediate synchronization of the current state. |
| `set_input` | Updates the raw text input entering the pipeline. |
| `add_operation` | Inserts a new ingredient at a specific index. |
| `edit_operation` | Updates the options/rules of an existing ingredient. |
| `remove_operations` | Deletes one or more ingredients from the recipe. |
| `swap_operations` | Reorders two ingredients. |
| `duplicate_operation` | Clones an existing ingredient at its current position. |
| `fix_operation` | Changes the type/name of an existing operation. |
| `set_global_option` | Toggles UI states like `pause_baking` or `show_help`. |
| `toggle_*` | Boolean toggles for `apply`, `stop`, `show`, `readonly`, etc. |

#### Synchronization Protocol

Whenever the recipe or input changes, the operation POSTs the current state to `${Server URL}/sync`. The payload includes:

- **recipe**: A JSON array of the ingredients within the context.
- **input**: The current raw text entering the first ingredient in context.
- **connector_index**: The 0-based index of the MCP AI Assistant within the synchronized slice.
- **global_options**: Current UI state (Baking status, visibility settings).

This allows the remote server to maintain a "Mirror" of the ASP Chef state, which is essential for providing LLMs with accurate context.

#### Placement and Protection

The position of the **MCP AI Assistant** ingredient is critical for security and stability:

- **Context Boundary**: The remote server only "sees" the portion of the recipe defined by the **Context Ingredients** setting (counting backwards from the **MCP AI Assistant**'s position).
- **Self-Protection**: To maintain a stable connection, the remote server is strictly prohibited from modifying or removing the **MCP AI Assistant** ingredient itself or any operations following it. A `remove_all_operations` command will only clear the recipe *within the exposed context*.

#### Exclusive Connection Management

To prevent synchronization conflicts and ensure a single "source of truth", this ingredient implements an exclusive connection policy:

- **Single Active Instance**: Only one **MCP AI Assistant** connection can be active at any given time.
- **Auto-Disconnection**: If you click **Connect** on a specific MCP AI Assistant ingredient, any other active connection—whether it belongs to another MCP AI Assistant ingredient in the same recipe or an instance running in a different browser tab/window—will be automatically disconnected.
- **Identifier-based Logic**: This behavior is enforced using the ingredient's unique identifier. Each time a connection is initiated, a broadcast signal is sent to all other instances, which will gracefully shut down their connection if they detect a new active session.

#### Quick Start: Local Implementation

To use this operation, you need an MCP Server that understands the ASP Chef synchronization protocol. You can use the official Python implementation:

[**ASP Chef MCP Server (GitHub)**](https://github.com/pit0500/asp-chef-mcp-server)

**Example Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "asp-chef": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/asp-chef-mcp-server/src/asp_chef_mcp_server",
        "run",
        "server.py"
        "--host",
        "localhost", // default
        "--port",
        "8000" // default
      ]
    }
  }
}
```
