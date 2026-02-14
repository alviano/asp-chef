The **@dumbo/Casper** operation invokes the [Casper](https://github.com/ndria00/Casper) solver with the program Base64-encoded in `__program__/1`.

This operation requires the [ASP Chef CLI](https://github.com/alviano/asp-chef-cli) and a local server (e.g., `python -m asp_chef_cli server`).
The Casper solver must be callable using the `casper` command.

§§§§

A simple way to go is to use an __Encode__ operation to store the program in the `__program__` _Predicate_.
An example is shown below.

We are defending a web server against the following attack vectors:
- Brute Force: causes high volume of requests.
- SQL Injection: sends malicious payloads.
- Phishing: Stealing credentials via email.

We have the following defenses:
- Rate Limiting: blocks IPs after a number of failed attempts (mitigates Brute Force).
- WAF (Web Application Firewall): blocks suspicious SQL patterns (mitigates SQL Injection).
- Zero-Trust Identity Proxy: every single request must be authenticated and authorized (mitigates Phishing and Brute Force).

**Assumption:** hackers want to remain stealthy.
No hacker can successfully coordinate a massive brute force, a complex SQLi, and a phishing campaign simultaneously without the SOC (Security Operations Center) instantly blacklisting the entire subnet.

**Question:** Which set of defenses make the web server secure?

We can encode the above scenario as follows:
```asp
%@exists
defense(Defense) :- mitigates(Defense, Attack), not nDefense(Defense).
nDefense(Defense) :- mitigates(Defense, Attack), not defense(Defense).

% copy atoms from the interpretation in input
mitigates(rate_limit,brute_force).
mitigates(waf,sqli).
mitigates(zero_trust,brute_force).
mitigates(zero_trust,phishing).

mitigated(Attack) :- defense(Defense), mitigates(Defense, Attack).


%@forall
attack(Attack) :- mitigates(Defense, Attack), not nAttack(Attack).
nAttack(Attack) :- mitigates(Defense, Attack), not attack(Attack).

% soc trigger(s)
:- attack(brute_force), attack(sqli), attack(phishing).


%@constraint
:- attack(X), not mitigated(X).
```

If we pack a recipe with the above program in an **Encode** ingredient (with _Predicate_ `__program__`) followed by **@dumbo/Casper** (with _Enumerate_ active), and use **Select Predicates** to keep `defense/1`, we obtain the following answer sets:
```asp
defense(rate_limit).
defense(waf).
defense(zero_trust).
§
defense(waf).
defense(zero_trust).
```

We can also interleave an **Expand Mustache Queries** to combine facts in the interpretations in input with the program given in the Encode ingredient.
For example, if the **Input** panel provides `mitigates/2` and SOC triggering conditions:
```asp
mitigates(rate_limit, brute_force).
mitigates(waf, sqli).
mitigates(zero_trust, brute_force).
mitigates(zero_trust, phishing).

soc_trigger(1, brute_force).
soc_trigger(1, sqli).
soc_trigger(1, phishing).
```
the program in the **Encode** ingredient can become
```asp
%@exists
defense(Defense) :- mitigates(Defense, Attack), not nDefense(Defense).
nDefense(Defense) :- mitigates(Defense, Attack), not defense(Defense).

% copy atoms from the interpretation in input
{{= @string_concat(mitigates(Defense, Attack), ".") : mitigates(Defense, Attack) }}

mitigated(Attack) :- defense(Defense), mitigates(Defense, Attack).


%@forall
attack(Attack) :- mitigates(Defense, Attack), not nAttack(Attack).
nAttack(Attack) :- mitigates(Defense, Attack), not attack(Attack).

% soc trigger(s)
{{= {{f":- {{
    #show (Attack,) : soc_trigger(${ID}, Attack).
    #show prefix("attack(").
    #show suffix(")").
    #show separator(", ").
  }}."}} : soc_trigger(ID, _) }}


%@constraint
:- attack(X), not mitigated(X).
```
Adding **Expand Mustache Queries** with *Multi-Stage* active before **@dumbo/Casper** would result in the two answer sets above.