The **Keybinding** operation adds a user-defined keybinding.

Keybindings are captured when no element has the focus (press `Escape` to release the focus). An atom of the form `__key__(KEY, index(INDEX), time(HOUR,MINUTES,SECONDS))` is added to each model in input (if predicate `__key__` is given).

The cache is invalidated when the keybinding is pressed. It can be used to implement _regular polling_ to external servers (e.g., if followed by **HackMD**).

**Attention!** User-defined keybindings have priority over UI keybindings. Duplicated user-defined keybindings can result in unexpected behavior.

§§§§

This operation enables interactive recipes that respond to specific keyboard inputs, allowing you to trigger logic or invalidate-cache manually.

#### Keyboard Interaction

To use a keybinding, ensure the browser focus is not inside an input field or code editor.
- **Key**: Any valid keyboard key string (e.g., `a`, `Enter`, `ArrowUp`).
- **Index**: An internal counter that increments each time the key is pressed.

#### The `__key__` Fact

When the specified key is pressed, a fact is injected into each model:
```asp
__key__("a", index(5), time(14, 30, 05)).
```
This is useful for creating "stateful" interactions. For example, you can use the `index` to cycle through a set of options or the `time` to record when an event occurred.

#### Cache Invalidation

One of the most powerful features of **Keybinding** is that it forces a re-computation of all subsequent ingredients. This makes it perfect for:
- Refreshing data from a remote source (GitHub/HackMD) on demand.
- Stepping through iterations of a logic-based simulation.
- Advancing a "slideshow" or multi-step visualization.

