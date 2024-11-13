The **Set Transformation of Extended Rules** operation configure handling of extended rules in clingo.

Default value is 2. Possible values:
- `all`: Transform all extended rules to basic rules
- `choice`: Transform choice rules, but keep cardinality and weight rules
- `card`: Transform cardinality rules, but keep choice and weight rules
- `weight`: Transform cardinality and weight rules, but keep choice rules
- `scc`: Transform "recursive" cardinality and weight rules
- `integ`: Transform cardinality integrity constraints
- `dynamic`: Transform "simple" extended rules, but keep more complex ones
- `no`: Disable
