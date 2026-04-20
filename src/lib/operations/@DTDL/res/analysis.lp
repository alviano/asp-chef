has_temperature_telemetry(Interface) :- interface(Interface), has_telemetry(Interface, Name, _), Name = "temperature".
relationship_count(Interface, Count) :- interface(Interface), Count = #count{R : has_relationship(Interface, _, R)}.
hub_interface(Interface, Count) :- relationship_count(Interface, Count), Count >= 3.
can_communicate_direct(I1, I2) :- has_relationship(I1, _, RelId), target(RelId, I2).
can_communicate(I1, I2, 1) :- can_communicate_direct(I1, I2).
can_communicate(I1, I3, D+1) :- can_communicate(I1, I2, D), can_communicate_direct(I2, I3), D < 3, I1 != I3.
shared_telemetry_count(I1, I2, Count) :- interface(I1), interface(I2), I1 < I2, Count = #count{T : has_telemetry(I1, T, _), has_telemetry(I2, T, _)}, Count > 0.
similar_interfaces(I1, I2, Count) :- shared_telemetry_count(I1, I2, Count).
path(I1, I2) :- can_communicate_direct(I1, I2).
path(I1, I3) :- path(I1, I2), can_communicate_direct(I2, I3), I1 != I3.
design_issue("cyclic_dependency", I1, I2) :- path(I1, I2), path(I2, I1), I1 < I2.
design_issue("inconsistent_telemetry_schema", Name, I1, I2, S1, S2) :- has_telemetry(I1, Name, Tel1), has_telemetry(I2, Name, Tel2), schema(Tel1, S1), schema(Tel2, S2), S1 != S2, I1 < I2.
%%% design_issue("naming_convention_violation", Interface, Name) :- interface(Interface), displayName(Interface, Name), not starts_with_uppercase(Name).
%%% starts_with_uppercase requires string built-in support not available in plain ASP; rule disabled until implemented.
design_issue("sensor_controls_actuator", Sensor, Actuator) :- sensor_interface(Sensor), actuator_interface(Actuator), can_communicate_direct(Sensor, Actuator).
extends_depth(I, 0) :- interface(I), not extends(I, _).
extends_depth(I, D+1) :- extends(I, Parent), extends_depth(Parent, D), D < 10.
design_issue("deep_extends_chain", I, D) :- extends_depth(I, D), D > 3.
outgoing_relationship_count(I, Count) :- interface(I), Count = #count{R : has_relationship(I, _, R)}.
design_issue("high_fan_out", I, Count) :- outgoing_relationship_count(I, Count), Count > 5.
incoming_relationship_count(I, Count) :- interface(I), Count = #count{R : has_relationship(_, _, R), target(R, I)}.
design_issue("isolated_interface", I, "no_connections") :- interface(I), outgoing_relationship_count(I, 0), incoming_relationship_count(I, 0).
stat_interface_count(Count) :- Count = #count{I : interface(I)}.
stat_relationship_count(Count) :- Count = #count{R : relationship(R)}.
stat_property_count(Count) :- Count = #count{P : property(P)}.
stat_telemetry_count(Count) :- Count = #count{T : telemetry(T)}.
stat_command_count(Count) :- Count = #count{C : command(C)}.
issue_count_critical(Count) :- Count = #count{I1, I2 : design_issue("cyclic_dependency", I1, I2)}.
non_critical_issue(Type, A, B)    :- design_issue(Type, A, B),    Type != "cyclic_dependency".
non_critical_issue(Type, A, B, C) :- design_issue(Type, A, B, C), Type != "cyclic_dependency".
non_critical_issue(Type, A, B, C, D, E) :- design_issue(Type, A, B, C, D, E), Type != "cyclic_dependency".
non_critical_issue_any(Type, A, B) :- non_critical_issue(Type, A, B).
non_critical_issue_any(Type, A, B) :- non_critical_issue(Type, A, B, _).
non_critical_issue_any(Type, A, B) :- non_critical_issue(Type, A, B, _, _, _).
issue_count_warning(Count) :- Count = #count{Type, A, B : non_critical_issue_any(Type, A, B)}.
#show has_temperature_telemetry/1.
#show hub_interface/2.
#show can_communicate/3.
#show similar_interfaces/3.
#show design_issue/3.
#show design_issue/6.
#show stat_interface_count/1.
#show stat_relationship_count/1.
#show stat_property_count/1.
#show stat_telemetry_count/1.
#show stat_command_count/1.
#show issue_count_critical/1.
#show issue_count_warning/1.
