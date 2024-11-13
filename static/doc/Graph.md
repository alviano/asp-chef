The **Graph** operation shows one model in input as a graph.

The graph is encoded by predicate `__graph__`. The first term is one of `node(ID)`, `link(SOURCE,TARGET)`, `defaults`. The other terms have the form `property(VALUE)`.

Node properties: label, image, color, draggable/undraggable, font, fx, fy, opacity, radius, shape, text\_color.

Link properties: directed/undirected, label, color, opacity, text\_color.

Default properties: node\_color, node\_draggable/node\_undraggable, node\_font, node\_image, node\_opacity, node\_radius (also defining the capture area for dragging nodes), node\_shape, node\_text\_color, link\_color, link\_text\_color, link\_opacity, directed/undirected.

Labels can be searched in the graph. If is active, drag the graph with the mouse to copy the layout (position of nodes).
