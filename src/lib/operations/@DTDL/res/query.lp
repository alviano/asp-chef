% Helper predicates for common DTDL queries

% Extract interface IDs without quotes
interface_id(I) :- interface(I).

% Find interfaces by name pattern (case insensitive matching would need external support)
interface_has_name(Interface, Name) :- interface(Interface), displayName(Interface, Name).

% Find all properties of an interface
interface_property(Interface, PropName, PropId) :- has_property(Interface, PropName, PropId).

% Find all telemetries of an interface
interface_telemetry(Interface, TelName, TelId) :- has_telemetry(Interface, TelName, TelId).

% Find all commands of an interface
interface_command(Interface, CmdName, CmdId) :- has_command(Interface, CmdName, CmdId).

% Find all relationships of an interface
interface_relationship(Interface, RelName, RelId) :- has_relationship(Interface, RelName, RelId).

% Find all components of an interface
interface_component(Interface, CompName, CompId) :- has_component(Interface, CompName, CompId).

% Find writable properties
writable_property(Interface, PropName, PropId) :- has_property(Interface, PropName, PropId), writable(PropId).

% Find relationships with their targets
relationship_with_target(Interface, RelName, RelId, Target) :-
    has_relationship(Interface, RelName, RelId),
    target(RelId, Target).

% Find schemas
has_schema(Element, Schema) :- schema(Element, Schema).

% Communication paths
can_communicate_direct(I1, I2) :- has_relationship(I1, _, RelId), target(RelId, I2).
can_communicate(I1, I2, 1) :- can_communicate_direct(I1, I2).
can_communicate(I1, I3, D+1) :- can_communicate(I1, I2, D), can_communicate_direct(I2, I3), D < 5, I1 != I3.

% Count relationships per interface
relationship_count(Interface, Count) :-
    interface(Interface),
    Count = #count{R : has_relationship(Interface, _, R)}.

% Count telemetries per interface
telemetry_count(Interface, Count) :-
    interface(Interface),
    Count = #count{T : has_telemetry(Interface, _, T)}.

% Count properties per interface
property_count(Interface, Count) :-
    interface(Interface),
    Count = #count{P : has_property(Interface, _, P)}.

% Count commands per interface
command_count(Interface, Count) :-
    interface(Interface),
    Count = #count{C : has_command(Interface, _, C)}.

% User query results will be shown
#show.
