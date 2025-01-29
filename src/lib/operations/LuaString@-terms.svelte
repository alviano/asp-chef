<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Lua String @-terms";
    const default_extra_options = {
        encode_predicate: '__base64__',
        prefix: 'string_',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(`
#script (lua)

function __unpack__(...)
  local args = {...}
  for i = 1, select("#", ...) do
    if args[i].type == clingo.SymbolType.Number then
      args[i] = args[i].number
    elseif args[i].type == clingo.SymbolType.String then
      args[i] = args[i].string
    else
      args[i] = tostring(args[i])
    end
  end
  return table.unpack(args)
end

function ${options.prefix}join(sep, ...)
  local args = {__unpack__(...)}
  local res = ""
  for i = 1, select("#", ...) do
    if i == 1 then
      res = res .. args[i]
    else
      res = res .. sep.string .. args[i]
    end
  end
  return res
end

function ${options.prefix}concat(...)
  return ${options.prefix}join(clingo.String(""), ...)
end

function ${options.prefix}byte(s, i)
  return string.byte(s.string, i.number)
end

function ${options.prefix}char(...)
  return string.char(__unpack__(...))
end

function ${options.prefix}find(s, p, i)
  return string.find(s.string, p.string, i.number)
end

function ${options.prefix}format(fs, ...)
  return string.format(fs.string, __unpack__(...))
end

function ${options.prefix}gmatch(s, p)
  return string.gmatch(s.string, p.string)
end

function ${options.prefix}gsub(s, p, r)
  return string.gsub(s.string, p.string, r.string)
end

function ${options.prefix}len(s)
  return string.len(s.string)
end

function ${options.prefix}lower(s)
  return string.lower(s.string)
end

function ${options.prefix}match(s, p, i)
  return string.match(s.string, p.string, i.number)
end

function ${options.prefix}rep(s, n)
  return string.rep(s.string, n.number)
end

function ${options.prefix}reverse(s)
  return string.reverse(s.string)
end

function ${options.prefix}sub(s, i, j)
  return string.sub(s.string, i.number, j.number)
end

function ${options.prefix}upper(s)
  return string.upper(s.string)
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
               data-testid="LuaString@-terms-encode-predicate"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Prefix</InputGroupText>
        <Input type="text"
               bind:value={options.prefix}
               placeholder="string_"
               on:input={edit}
               data-testid="LuaString@-terms-prefix}"
        />
    </InputGroup>
</Operation>
