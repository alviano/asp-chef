The **Graph** operation shows one model in input as a graph.

The graph is encoded by the predicate `__graph__/X`. The first term is one of `node(ID)`, `link(SOURCE,TARGET)`, or `defaults`. Subsequent terms specify properties in the form `property(VALUE)`.

Node properties: label, image, color, draggable/undraggable, font, fx, fy, opacity, radius, shape, text\_color.

Link properties: directed/undirected, label, color, opacity, text\_color.

Default properties: node\_color, node\_draggable/node\_undraggable, node\_font, node\_image, node\_opacity, node\_radius, node\_shape, node\_text\_color, link\_color, link\_text\_color, link\_opacity, directed/undirected.

Labels can be searched in the graph. If active, drag the graph with the mouse to copy the layout (position of nodes).

§§§§

This operation provides a flexible force-directed graph visualization directly from ASP atoms.

#### Defining Nodes

`__graph__(node(ID), label(TEXT), color(COLOR), ...)`

Example:
```asp
__graph__(node(1), label("Alice"), color(red)).
__graph__(node(2), label("Bob"), color(blue)).
```

#### Defining Links

`__graph__(link(SOURCE_ID, TARGET_ID), label(TEXT), color(COLOR), ...)`

Example:
```asp
__graph__(link(1, 2), label("friends"), directed).
```

#### Global Defaults

Use `defaults` to set properties for all nodes and links at once:
```asp
__graph__(defaults, node_radius(15), node_color(gray), directed).
```

### Interaction and Layout

*   **Search**: Use the "Search term" option in the ingredient to highlight matching nodes.
*   **Draggable/Undraggable**: Individual nodes can be pinned using `fx(X)` and `fy(Y)` properties combined with `undraggable`.
*   **Layout Persistence**: You can copy the current node positions to your clipboard (as a set of ASP atoms) by dragging the graph or using specific UI controls, allowing you to "save" a manual layout into your program.

#### Tip: Creating Graphs from your Data

Often, you have your own predicates (like `edge(U, V)`) and you want to visualize them. Use a simple ASP rule in an **Encode** ingredient before the **Graph** ingredient:
```asp
__graph__(link(U, V), directed) :- edge(U, V).
__graph__(node(U), label(U)) :- edge(U, _).
__graph__(node(V), label(V)) :- edge(_, V).
```
