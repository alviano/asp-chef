const AsyncFunction = Object.getPrototypeOf(async function(){ /* empty */ }).constructor;

onmessage = async (event) => {
    let res;
    let err;
    try {
        res = await (new AsyncFunction("input", "options", event.data.code)(event.data.input, event.data.options));
    } catch(error) {
        res = [];
        err = error;
    }
    postMessage({ res, err });
};

export {};