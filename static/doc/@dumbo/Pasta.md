The **@dumbo/Pasta** operation invokes the [PASTA](https://github.com/damianoazzolini/pasta) (Probabilistic Answer Set programming for STAtistical probabilities) solver with the program Base64-encoded in `__program__/1`.

This operation requires the [ASP Chef CLI](https://github.com/alviano/asp-chef-cli) and a local server (e.g., `python -m asp_chef_cli server`).
The binary `pastasolver` must be in the PATH.

§§§§

A simple way to go is to use an **Encode** operation to store the program in the `__program__` *Predicate*.
An example is shown below.

We are evaluating the reliability of a sensor network where events have known probabilities of occurrence:

* A sensor has a 20% probability of hardware failure.
* A network channel has a 10% probability of dropping packets.

We have the following conditions:

* A reading is missed if the sensor itself fails.
* A reading is missed if the sensor's communication channel drops the packet.

**Assumption:** Hardware failures and packet drops are independent events.

**Question:** What are the probability bounds of missing a reading for the sensors in our network?

We can encode the above scenario as follows:

```asp
% probabilistic facts
0.2::hw_fail(s1).
0.1::drop(c1).

% rules defining a missed reading
missed_reading(Sensor) :- hw_fail(Sensor).
missed_reading(Sensor) :- drop(Channel), connected(Sensor, Channel).

% the program MUST include a query
query(missed_reading(s1)).
```

If we pack a recipe with the above program in an **Encode** ingredient (with *Predicate* `__program__`) followed by **@dumbo/Pasta** (with `bound_multiplier` set to `100`), and use **Select Predicates** to keep `__bounds__` (the default *Output* predicate), we obtain the following answer set representing the probability bounds scaled as percentages:

```asp
__bounds__(28, 28).

```

We can also interleave an **Expand Mustache Queries** to combine facts in the interpretations in input with the probabilistic program given in the Encode ingredient.
For example, if the **Input** panel provides the topology of our sensors and channels:

```asp
sensor(s1).
channel(c1).
connected(s1, c1).
query(missed_reading(s1)).
```

the program in the **Encode** ingredient can become

```asp
% probabilistic facts generated from input
{{= {{f"0.2::hw_fail(${Sensor})."}} : sensor(Sensor) }}
{{= {{f"0.1::drop(${Channel})."}} : channel(Channel) }}

% rules defining a missed reading
missed_reading(Sensor) :- hw_fail(Sensor).
missed_reading(Sensor) :- drop(Channel), connected(Sensor, Channel).

{{= {{f"query(${X})."}} : query(X) }}
```

Adding **Expand Mustache Queries** with *Multi-Stage* active before **@dumbo/Pasta** would result in the probability bounds calculated dynamically based on the provided input graph. If the `bound_multiplier` is left to its default `0`, the output will yield real values between 0 and 1 without retaining the original encoded program:

```asp
__bounds__(real("0.2"),real("0.2")).
```