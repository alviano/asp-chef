__debug__("undefined_target", Rel, Target) :- relationship(Rel), target(Rel, Target), not interface(Target).
__debug__("max_multiplicity_exceeded", Rel, Count, Max) :- relationship(Rel), maxMultiplicity(Rel, Max), Count = #count{I : instance_of(I, Rel)}, Count > Max.
__debug__("missing_required_property", Interface, PropName) :- interface(Interface), has_property(Interface, PropName, PropId), not writable(PropId), not property_value_defined(Interface, PropName).
