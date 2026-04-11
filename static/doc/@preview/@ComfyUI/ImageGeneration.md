The **@ComfyUI/Image Generation** operation reads a Base64-encoded JSON configuration from `__comfy__` (default predicate name, customizable).

The JSON must describe a ComfyUI workflow exported in **API format**. 
ASP-chef submits it to ComfyUI and collects one or more generated images.

Only images produced through `SaveImageWebsocket` nodes are captured, and they are stored as Base64 strings in `__comfy_image__` (default predicate name, customizable).

§§§§

Use this operation when you want ASP-Chef to trigger image generation in ComfyUI from facts in your current model.

#### Input configuration

- The operation expects a unary predicate containing a Base64-encoded JSON object (default: `__comfy__`).
- You can change the input predicate name in the operation options.
- The decoded JSON must be a ComfyUI workflow exported in **API version** (direct workflow JSON, or wrapped under `workflow`).
- The decoded JSON can include a `server` key to use a different ComfyUI URL.
- If `server` is not provided, ASP-chef uses `http://localhost:8188`.

#### Image collection

- ASP-chef connects to ComfyUI, queues the prompt, and listens on the ComfyUI WebSocket.
- Generated images are collected only from nodes of type `SaveImageWebsocket`.
- Each collected image is stored as Base64 content in the output predicate (default: `__comfy_image__`).
- You can change the output predicate name in the operation options.

#### Using generated images in Markdown

The resulting Base64 images can be rendered by **Markdown** ingredients. For example:

```asp
{{= png(X) : __comfy_image__(X) }}
```

This template reads each image payload `X` from `__comfy_image__/1` and renders it as a PNG in the Markdown output.
