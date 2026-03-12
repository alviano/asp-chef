The **Server** operation asks a remote or local server to process the input.

Input and output must be arrays of models. Additional options can be sent to the server; it is up to the server to interpret such options. For example, a server may implement the _Search Models_ operation and accept options like a predicate to decode, the number of models to compute and so on.

Note that the result is cached (as for many other operations). In order to fetch new data even if the input didn't change, add an _Invalidate Cache_ operation.

§§§§

This operation allows you to delegate the processing of your ASP models to an external service. This is useful when the required computation is too heavy for the browser, requires specialized hardware, or involves proprietary algorithms.

#### Communication Protocol

The operation sends an HTTP POST request to the specified **URL**.
- **Body**: A JSON object containing the current `input` (array of models) and the `options` configured in the ingredient.
- **Response**: The server is expected to return a JSON array of models (or a single model, which will be wrapped in an array).

#### Use Cases: Offloading Computation

*   **Remote Solving**: Send your program and facts to a high-performance cluster running a specialized version of Clingo or another solver.
*   **Machine Learning Integration**: Pass your models to a Python server that applies a neural network model to the facts and returns new "inferred" facts.
*   **Database Lookups**: Use the server as a proxy to query a SQL or NoSQL database based on the current context of your ASP models.

#### Security Note

When using a remote server, ensure that the connection is secure (HTTPS) if your models contain sensitive information. The server must also support Cross-Origin Resource Sharing (CORS) to allow requests from the ASP-chef domain.

