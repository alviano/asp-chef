<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Introspection Terms";
    const default_extra_options = {
        encode_predicate: '__base64__',
        at_terms: {
            argument: "argument",
            arity: "arity",
            error: "error",
            error_message: "error_message",
            functor: "functor",
        }
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(`
#script (lua)

function ${options.at_terms.error}(details)
  return clingo.Function("${options.at_terms.error}", details)
end

function ${options.at_terms.error_message}(error)
  if error.name ~= "${options.at_terms.error}" then
    return "Cannot process error!"
  end

  args = {}
  for k,v in pairs(error.arguments) do
    if v.number ~= nil then
      args[k] = v.number
    else
      args[k] = v.string
    end
  end
  return string.format(table.unpack(args))
end

function ${options.at_terms.functor}(term)
  if term.name == nil then
    return error({"%s has no name", tostring(term)})
  end
  return term.name
end

function ${options.at_terms.arity}(term)
  return #term.arguments
end

function ${options.at_terms.argument}(term, index)
  index = index.number
  if index == 0 then
    return functor(term)
  elseif #term.arguments < index then
    return error({"%s has no argument at index %d", tostring(term), index})
  else
    return term.arguments[index]
  end
end

#end.
        `.trim());

        const encoded_content = `${options.encode_predicate}("${content}").`;
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(mapper).join('\n') + encoded_content;
                const model = await Utils.search_model(program);
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 10em;">Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="IntrospectionTerms-encode-predicate"
        />
    </InputGroup>
    {#each ['error(details)', 'error_message(error)', 'functor(term)', 'arity(term)', 'argument(term, index)'].sort() as term}
        <InputGroup>
            <InputGroupText style="width: 10em;">@{term.split('(')[0]}</InputGroupText>
            <Input type="text"
                   bind:value={options.at_terms[term.split('(')[0]]}
                   placeholder="function"
                   on:input={edit}
                   data-testid="IntrospectionTerms-{term.split('(')[0]}"
            />
        </InputGroup>
    {/each}
</Operation>
