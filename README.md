# ASP Chef

[ASP Chef](https://asp-chef.alviano.net/) is a simple, intuitive web app for analysing answer sets without having to deal with complex tools or programming languages...
well, excluding ASP!

ASP Chef is inspired by [CyberChef](https://gchq.github.io/CyberChef/#input=UVZOUUlFTm9aV1lo), and as such it is designed to ease the creation of pipelines of operations over arrays of models rather than being an IDE or editor for ASP.

Below is a demo video:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/QRnCGe4ad-Y/3.jpg)](https://www.youtube.com/watch?v=QRnCGe4ad-Y)

## Prerequisites

A modern browser!
[Firefox](https://www.mozilla.org/en-US/firefox/new/) is a good choice as it has no restriction on the length of URLs.
Large pipelines may hit the restriction on the URL length of other browsers due to the way ASP Chef encodes recipes in the URL.

No other software is needed as everything is run in the browser thanks to [SvelteKit](https://kit.svelte.dev/), [clingo-wasm](https://github.com/domoritz/clingo-wasm), and many other Javascript libraries.

## Usage

The UI comprises three vertical panels, namely the __Operations panel__, the __Recipe panel__ and the __I/O panel__.

__ASP Chef__ recipes constitute a pipeline where each step takes in input an array of models and provides in output an array of models;
actually, a model in this context is any valid output of ASP systems, that is, even ground terms can be elements of a model.

The recipe is composed by selecting ingredients from the __Operations panel__ and setting their options in the __Recipe panel__.
Popovers are shown for each operation to provide a minimal explanation on how to use it in a recipe. 

The pipeline starts by splitting the input of the recipe (given in the __I/O panel__) on occurrences of the _reserved_ character `§`.
Each part of the input is parsed and checked to be a valid model.
Upon termination, the output of the last step of the recipe is shown in the __I/O panel__. 

The recipe and its input are encoded in the URL, which can be used to restore the recipe and its input for future usage.
As the list of operations grows, and the operations are extended and modified, it is possible that a previously crafted recipe becomes incompatible with the current deployed version of ASP Chef.
While it is possible that in the future a mechanism to preserve retro-compatibility will be implemented, it must be noted that at the moment the main goal of ASP Chef is to ease the fast prototyping of ASP pipelines rather than their long terming usage. 

## Examples

### Billy the Kid

A problem from the [LP/CP Programming Contest 2019](https://github.com/lpcp-contest/lpcp-contest-2019).
It is described [here](https://github.com/lpcp-contest/lpcp-contest-2019/blob/master/billykid/billykid.md).
An ASP Chef recipe solving the problem and including a graphical representation of intermediate steps can be found
[here](https://asp-chef.alviano.net/#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!).

### Aquarium

A problem from the [LP/CP Programming Contest 2020](https://github.com/lpcp-contest/lpcp-contest-2020/).
It is described [here](https://github.com/lpcp-contest/lpcp-contest-2020/tree/master/problem-1).
An ASP Chef recipe solving the problem and including a graphical representation of the solution can be found
[here](https://asp-chef.alviano.net/#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!)

### Buttons and Scissors

A problem from the [LP/CP Programming Contest 2021](https://github.com/lpcp-contest/lpcp-contest-2021/).
It is described [here](https://github.com/lpcp-contest/lpcp-contest-2021/tree/main/problem-2).
An ASP Chef recipe solving the problem and including a graphical representation of intermediate steps can be found 
[here](https://asp-chef.alviano.net/#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!).

### Fortress

A problem from the [LP/CP Programming Contest 2022](https://github.com/lpcp-contest/lpcp-contest-2022/).
It is described [here](https://github.com/lpcp-contest/lpcp-contest-2022/tree/main/problem-1).
An ASP Chef recipe solving the problem and including a graphical representation of the solution can be found 
[here](https://asp-chef.alviano.net/#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!)

## Development

### Setup

Checkout the repository and run
```bash
$ npm install             # install dependencies
$ npx playwright install  # for E2E test automation
```

Link `clingo.wasm` as a static file with
```bash
$ mkdir -p static/dist; ln -s ../../node_modules/clingo-wasm/dist/clingo.wasm static/dist/
```

Start the development server on port 5188 with
```bash
$ npm run dev
```

Run E2E tests with one of the following commands:
```bash
$ npm run test                                 # all tests are run headless
$ npm run test tests/test.Something.ts         # tests from a single file
$ npm run test:headed                          # all tests, show the browser
$ npm run test:headed tests/test.Something.ts  # single file, show the browser
```

### Adding new operations

Create a component in `src/lib/operations` and link it in the component `<RecipePanel>`.

The operation must be associated with a unique name.
The file implementing the operation must be named as the operation itself, spaces excluded. 

The operation must define its default options and register itself in the `Recipe` class.
When instantiated as an ingredient, the operation will receive in input an array of models, and it is expected to produce in output an array of models.
If the operation must show something depending on the input it will receive, listeners must be used (see the __Output operation__).

The DOM content of the operation should just instantiate the generic `<Operation>` component with a minimal description to be shown as a _popover_ and the content to show when the operation is added as an ingredient.

To ease test automation it is strongly suggested to add `data-testid` attributes to I/O elements of interest.
To actually test an operation add a file in `tests/test.OperationName.ts` with the relevant testcases.
Again, to ease the testing of combinations of different operations implement a method in `tests/utils.ts` to add the operation as an ingredient with the provided options.  


### How to implement an external server

The __Server__ operation interacts with a remote or local server.
The actual server can implement any function and is required to answer to a POST request with JSON content.
The JSON content is an object with properties `input_part`, `decoded_input` and `options`.

A request is done for each model in input, where `input_part` contains the list of atoms (as strings), `decoded_input` contains the content decoded from some Base64 predicate, and `options` is a string given in the ingredient.
It is up to the server to give a meaning to these elements, and to produce in response a JSON object with property `models`.

A minimalist example of server searching for stable models via the Python API of clingo is given below.
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import clingo


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5188", "https://asp-chef.alviano.net"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.post("/")
async def process(request: Request):
    json = await request.json()
    input_part = json["input_part"]
    decoded_input = json["decoded_input"]
    options = json["options"]
    
    control = clingo.Control(options)
    program = '\n'.join([f"{atom}." for atom in input_part]) + '\n'.join(decoded_input)
    control.add(program)
    control.ground([("base", [])])
    res = []
    control.solve(on_model=lambda model: res.append([str(atom) for atom in model.symbols(shown=True)]))
    return {"models" : res}
```

If the above script is saved in the file `clingo_server.py`, the server can be run with 
```bash
$ uvicorn clingo_server:app
```

As another example, a server relying on [MiniZinc](https://minizinc-python.readthedocs.io/en/latest/index.html) can be implemented as follows:
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from minizinc import Instance, Model, Solver

import re


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5188", "https://asp-chef.alviano.net"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)

constant_pattern = re.compile('^constant\((?P<name>\w+),(?P<value>\d+)\)$')


@app.post("/")
async def process(request: Request):
    json = await request.json()
    input_part = json["input_part"]
    decoded_input = json["decoded_input"]
    options = json["options"]
    
    solver = Solver.lookup("gecode")
    model = Model()
    model.add_string('\n'.join(decoded_input))
    instance = Instance(solver, model)
    for atom in input_part:
        match = constant_pattern.match(atom)
        if match:
            name = match.group('name')
            value = int(match.group('value'))
            instance[name] = value
            
    res = await instance.solve_async()
    res = list(f"{options}({index},{value})" for index, value in enumerate(res[options], start=1))
    return {"models" : [res]}
```
The above script interprets the encoded content as a MiniZinc model (the analogous of a program in ASP),
instances of predicate `constant/2` as integer constants, and the content of options as the name of the variable to return in output.

## Contributors

* [Mario Alviano](https://alviano.net)
* Davide Cirimele
* Luis Angel Rodriguez Reiners