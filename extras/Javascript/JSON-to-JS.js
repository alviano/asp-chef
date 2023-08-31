if (options === "DESCRIBE") {
  return {
    name: "JSON to JS",
    doc: `
Convert **Relaxed JSON (RJSON)** (\`http://www.relaxedjson.org/\`) strings to JSON strings.

Strings are Base64-encoded in the first term of predicate \`__base64__\`.
    `,
    options: ["Predicate|text|predicate|__base64__"]
  };
}

const {toJs} = await import('https://esm.run/really-relaxed-json');
const {Base64} = await import("https://esm.run/js-base64");
const predicate = options["Predicate"];

return input.map(part => part.map(atom => {
  if (atom.predicate === predicate) {
    const term = Base64.decode(atom.terms[0].string);
    const new_term = Base64.encode(toJs(term));
    return { str: `${predicate}("${new_term}")` };
  }
  return atom;
}));
