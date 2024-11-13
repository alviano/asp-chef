The **Keybinding** operation adds a user-defined keybinding.

Keybindings are captured when no element has the focus (press `Escape` to release the focus). An atom of the form `__key__(KEY, index(INDEX), time(HOUR,MINUTES,SECONDS))` is added to each model in input (if predicate `__key__` is given).

The cache is invalidated when the keybinding is pressed. It can be used to implement _regular polling_ to external servers (e.g., if followed by **HackMD**).

**Attention!** User-defined keybindings have priority over UI keybindings. Duplicated user-defined keybindings can result in unexpected behavior.
