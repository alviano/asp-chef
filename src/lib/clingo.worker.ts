// adapted from clingo-wasm

import {init} from "$lib/clingo.module";

let run;

async function initRun(wasmUrl?: string) {
    run = await init({
        locateFile(path) {
            if (wasmUrl) {
                return wasmUrl;
            }
            if (path.endsWith(".wasm")) {
                return `${location.origin}/dist/clingo.wasm`;
            }
            return path;
        },
    });
}

onmessage = async (event) => {
    const message = event.data;

    if (message.type === "run") {
        if (!run) {
            await initRun();
        }
        const results = run(...message.args);
        postMessage(results, undefined);
    }
};

export {};