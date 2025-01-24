The **Extract Facts** operation processes Base64-encoded content and applies a simple regular expression to extract facts.

Due to the used regular expression, atom terms are expected to not include any closed parenthesis.
Predicates of arity 0 are not extracted.
Facts are not necessarily terminated by `.`.

The processed Base64-encoded content is given by the predicate `__base64__/1`, which can be echoed in the output.

The extracted atoms are added to the output.
