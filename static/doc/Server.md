The **Server** operation asks a remote or local server to process the input.

Input and output must be arrays of models. Additional options can be sent to the server; it is up to the server to interpret such options. For example, a server may implement the _Search Models_ operation and accept options like a predicate to decode, the number of models to compute and so on.

Note that the result is cached (as for many other operations). In order to fetch new data even if the input didn't change, add an _Invalidate Cache_ operation.
