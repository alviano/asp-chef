<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Lua Expression @-terms";
    const default_extra_options = {
        encode_predicate: '__base64__',
        prefix: 'expr',
    };

    const uuid = Utils.uuid();
    const unpack = `__unpack_${uuid}`;
    const __expr = `__expr_${uuid}`;

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(`
#script (lua)

function ${options.prefix}(...)
  return ${__expr}(${options.prefix}_string(...))
end

function ${options.prefix}_string(...)
  local args = {${unpack}(...)}
  local expression = ""
  for i = 1, select("#", ...) do
    expression = expression .. args[i]
  end
  return expression
end

function ${options.prefix}f(format, ...)
  return ${__expr}(${options.prefix}f_string(format, ...))
end

function ${options.prefix}f_string(format, ...)
  return string.format(format.string, ${unpack}(...))
end


-- aux functions (not intended to be called by you)

function ${unpack}(...)
  local args = {...}
  for i = 1, select("#", ...) do
    if args[i].type == clingo.SymbolType.Number then
      args[i] = args[i].number
    elseif args[i].type == clingo.SymbolType.String then
      args[i] = args[i].string
    elseif args[i].type == clingo.SymbolType.Function and args[i].name == "real" and #args[i].arguments == 1 and args[i].arguments[1].type == clingo.SymbolType.String then
      args[i] = tonumber(args[i].arguments[1].string)
    else
      args[i] = tostring(args[i])
    end
  end
  return table.unpack(args)
end

function ${__expr}(expression)
  local sandbox_env = {
    tonumber = tonumber,
    tostring = tostring,
    math = math,
    string = string,
  }

  -- Load the code with the restricted environment
  local code = "return " .. expression
  local func, err = load(code, "sandbox_code", "t", sandbox_env)
  if not func then
    error(err)
  end

  local res = func()
  if type(res) == "number" then
    if res % 1 == 0 then
      return res
    end
    return clingo.Function("real", {tostring(res)})
  elseif type(res) == "boolean" then
    return clingo.Function(tostring(res))
  end
  return tostring(res)
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
               data-testid="LuaExpression@-terms-encode-predicate"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Prefix</InputGroupText>
        <Input type="text"
               bind:value={options.prefix}
               placeholder="string_"
               on:input={edit}
               data-testid="LuaExpression@-terms-prefix}"
        />
    </InputGroup>
</Operation>
