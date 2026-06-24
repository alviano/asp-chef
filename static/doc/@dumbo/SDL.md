The **@dumbo/SDL** operation translates a Structured Declarative Language (SDL) program stored in the `__program__` predicate into an equivalent logic program optimized for downstream solvers.

This operation bridges the gap between high-level structural modeling and low-level declarative solving.

§§§§

### What is SDL?

Structured Declarative Language (SDL) is a higher-level abstraction layer built over declarative paradigms. Standard Answer Set Programming (ASP) or Constraint Programming (CP) can become unmanageable as rule sets scale. SDL introduces structural elements that organize data, modules, and constraints into a clean, modern syntax without sacrificing declarative power.

### How It Works

The **SDL** ingredient acts as an automated compiler and translator within your pipeline:

1. **Ingestion**: It extracts the SDL program from your model, where it is typically stored as a Base64-encoded string inside the `__program__` predicate.
2. **Translation**: The program is sent to the Dumbo backend service, which parses the high-level structures.
3. **Target Compilation**: By default, the service rewrites the logic into standard **ASP rules**. Alternatively, the operation can target **MiniZinc**.
4. **Re-encoding**: The resulting target code is re-encoded into Base64 and injected back into the model, cleanly replacing the original SDL facts.

---

### Syntax & Compilation Examples

#### Example 1: Resource Assignment

This example demonstrates a basic assignment problem where cabs are assigned to customers.

**SDL Specification:**

```asp
record Cab: id: int, driver: str;
record Customer: id: int, name: str, title: str;
record Assign: customer: Customer, cab: Cab;

-- Guess exactly 1 cab for every customer
guess from Customer exactly 1
  Assign from Cab
  where Assign.customer == Customer and Assign.cab == Cab;

-- Enforce that no cab is assigned more than 1 customer
deny from Cab having
  count { Assign.customer from Assign where Assign.cab == Cab } > 1;
```

**ASP Target Output:** The compiler maps the `guess` construct into an ASP choice rule and the `deny` into an integrity constraint:


```asp
{ assign(customer(C,_,_), cab(C',_)) : cab(C', D) } = 1 :- customer(C, N, T).
:- cab(C, D), #count { C' : assign(customer(C',_,_), cab(C,_)) } > 1.
```



#### Example 2: Graph Reachability & Cardinality

This example handles the classic Hamiltonian Cycle problem, highlighting non-deterministic choices alongside recursive path tracking.

**SDL Specification:**

```asp
record Node: id: int;
record Arc: first: Node, second: Node;
record InCycle: first: Node, second: Node;
record Reached: node: Node;
record Start: node: Node;

-- Guess exactly 1 outgoing arc per node
guess from Node exactly 1
  InCycle from Arc
  where InCycle.first == Node and InCycle.second == Arc.second;

-- Deny if a node does not have exactly 1 incoming arc
deny from Node
  having count { InCycle.first from InCycle where Node == InCycle.second } != 1;

-- Recursively define reachability
define Reached from Start where Start.node == Reached.node;
define Reached as r1 from Reached as r2, InCycle
  where r2.node == InCycle.first and r1.node == InCycle.second;

-- Every node must be reached
deny from Node, not Reached where Node == Reached.node;
```

**ASP Target Output:** The recursive `define` blocks map into inductive rules, and negation translates to default negation (`not`):


```asp
{ incycle(node(X), node(Y)) : arc(node(X), node(Y)) } = 1 :- node(X).
:- node(X), #count { Y : incycle(node(Y), node(X)) } != 1.
reached(node(X)) :- start(node(X)).
reached(node(Y)) :- reached(node(X)), incycle(node(X), node(Y)).
:- node(X), not reached(node(X)).
```


**MiniZinc Target Output:** When targeting Constraint Programming, the compiler automatically bridges the semantic gap by translating the non-deterministic `guess` into finite-domain decision variables (`var bool`), resolving negation as failure, and unrolling recursive `define` blocks using rank-based tracking techniques.

---

### Why Use SDL?

* **Readability**: Keeps complex rule sets clear and highly legible.
* **Maintainability**: Structural features make large-scale projects easier to debug and scale over time.
* **Flexibility**: By changing a single option, you can compile the exact same high-level logic into either ASP or MiniZinc, allowing you to benchmark different solver ecosystems effortlessly.

### Pipeline Integration

Because the **SDL** operation acts purely as a rewriting step, it does not solve the model itself. To execute the compiled code, you should immediately follow this ingredient with a solver operation tailored to your compilation target:

* For the **ASP** target: Follow with a **Search Models** or **Optimize** ingredient.
* For the **MiniZinc** target: Follow with **MiniZinc** ingredient.