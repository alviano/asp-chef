The **@dumbo/Move Before** operation can be used to reorder the program stored in `__program__`.

One or more _atom patterns_ can be specified. (Each atom pattern is terminated by a dot, as for facts, but may contain variables.) Rules matching (i.e., relaxed unifying with) any given pattern are moved up in the program.
