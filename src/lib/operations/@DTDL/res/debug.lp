__debug__("undefined_target", Rel, Target) :- relationship(Rel), target(Rel, Target), not interface(Target).
%%% max_multiplicity_exceeded requires instance_of/2 facts (produced at runtime, not by @DTDL/Parse); disabled.
%%% __debug__("max_multiplicity_exceeded", Rel, Count, Max) :- relationship(Rel), maxMultiplicity(Rel, Max), Count = #count{I : instance_of(I, Rel)}, Count > Max.
__debug__("missing_required_property", Interface, PropName) :- property_value_defined(Interface, PropName), not has_property(Interface, PropName, _).
