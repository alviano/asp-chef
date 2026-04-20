__debug__("undefined_target", Rel, Target) :- relationship(Rel), target(Rel, Target), not interface(Target).
%%% max_multiplicity_exceeded requires instance_of/2 facts (produced at runtime, not by @DTDL/Parse); disabled.
%%% __debug__("max_multiplicity_exceeded", Rel, Count, Max) :- relationship(Rel), maxMultiplicity(Rel, Max), Count = #count{I : instance_of(I, Rel)}, Count > Max.
__debug__("missing_required_property", Interface, PropName) :- property_value_defined(Interface, PropName), not has_property(Interface, PropName, _).
__debug__("extends_undefined", Interface, Parent) :- extends(Interface, Parent), not interface(Parent).
__debug__("duplicate_property_name", Interface, Name) :- has_property(Interface, Name, Id1), has_property(Interface, Name, Id2), Id1 != Id2.
__debug__("duplicate_telemetry_name", Interface, Name) :- has_telemetry(Interface, Name, Id1), has_telemetry(Interface, Name, Id2), Id1 != Id2.
__debug__("self_referencing_relationship", Interface, RelName) :- has_relationship(Interface, RelName, Rel), target(Rel, Interface).
__debug__("component_schema_undefined", Interface, CompName) :- has_component(Interface, CompName, Comp), schema(Comp, S), not interface(S).
__debug__("duplicate_relationship_name", Interface, Name) :- has_relationship(Interface, Name, Id1), has_relationship(Interface, Name, Id2), Id1 != Id2.
__debug__("ambiguous_name", Interface, Name) :- has_property(Interface, Name, _), has_telemetry(Interface, Name, _).
extends_path(A, B) :- extends(A, B).
extends_path(A, C) :- extends_path(A, B), extends(B, C).
__debug__("circular_extends", Interface, Interface) :- extends_path(Interface, Interface).
%%% New rules (11-25)
__debug__("ambiguous_name_rel", Interface, Name) :- has_relationship(Interface, Name, _), has_property(Interface, Name, _).
__debug__("ambiguous_name_rel", Interface, Name) :- has_relationship(Interface, Name, _), has_telemetry(Interface, Name, _).
__debug__("duplicate_command_name", Interface, Name) :- has_command(Interface, Name, Id1), has_command(Interface, Name, Id2), Id1 != Id2.
__debug__("ambiguous_name_cmd", Interface, Name) :- has_command(Interface, Name, _), has_property(Interface, Name, _).
__debug__("ambiguous_name_cmd", Interface, Name) :- has_command(Interface, Name, _), has_telemetry(Interface, Name, _).
__debug__("component_self_reference", Interface, CompName) :- has_component(Interface, CompName, Comp), schema(Comp, Interface).
__debug__("inherited_name_conflict", Interface, Name) :- extends_path(Interface, Parent), has_property(Interface, Name, _), has_property(Parent, Name, _).
__debug__("inherited_name_conflict", Interface, Name) :- extends_path(Interface, Parent), has_telemetry(Interface, Name, _), has_telemetry(Parent, Name, _).
extends_depth(A, 0) :- interface(A), not extends(A, _).
extends_depth(A, D+1) :- extends(A, B), interface(B), extends_depth(B, D), D < 10.
__debug__("deep_extends_chain", Interface, Interface) :- extends_depth(Interface, D), D > 3.
primitive_schema("boolean"). primitive_schema("date"). primitive_schema("dateTime").
primitive_schema("double"). primitive_schema("duration"). primitive_schema("float").
primitive_schema("integer"). primitive_schema("long"). primitive_schema("string"). primitive_schema("time").
__debug__("property_schema_undefined", Interface, Name) :- has_property(Interface, Name, Id), schema(Id, S), not primitive_schema(S), not interface(S), not enum(S, _), not object(S), not array(S, _), not map(S, _).
__debug__("enum_no_values", Interface, Name) :- has_property(Interface, Name, Id), schema(Id, S), enum(S, _), not enum_value(S, _, _).
__debug__("enum_no_values", Interface, Name) :- has_telemetry(Interface, Name, Id), schema(Id, S), enum(S, _), not enum_value(S, _, _).
__debug__("object_no_fields", Interface, Name) :- has_property(Interface, Name, Id), schema(Id, S), object(S), not has_field(S, _, _).
__debug__("object_no_fields", Interface, Name) :- has_telemetry(Interface, Name, Id), schema(Id, S), object(S), not has_field(S, _, _).
referenced_interface(T) :- target(_, T).
referenced_interface(T) :- extends(_, T).
referenced_interface(T) :- schema(_, T), interface(T).
__debug__("isolated_interface", Interface, Interface) :- interface(Interface), not referenced_interface(Interface).
__debug__("command_request_schema_undefined", Interface, Name) :- has_command(Interface, Name, Id), command_request(Id, S), not primitive_schema(S), not interface(S), not enum(S, _), not object(S), not array(S, _), not map(S, _).
__debug__("command_response_schema_undefined", Interface, Name) :- has_command(Interface, Name, Id), command_response(Id, S), not primitive_schema(S), not interface(S), not enum(S, _), not object(S), not array(S, _), not map(S, _).
