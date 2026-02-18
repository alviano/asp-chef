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
design_issue("naming_convention_violation", Interface, Name) :- interface(Interface), displayName(Interface, Name), not starts_with_uppercase(Name).
%%% starts_with_uppercase(Name) :- Name = Name.
design_issue("sensor_controls_actuator", Sensor, Actuator) :- sensor_interface(Sensor), actuator_interface(Actuator), can_communicate_direct(Sensor, Actuator).
stat_interface_count(Count) :- Count = #count{I : interface(I)}.
stat_relationship_count(Count) :- Count = #count{R : relationship(R)}.
stat_property_count(Count) :- Count = #count{P : property(P)}.
stat_telemetry_count(Count) :- Count = #count{T : telemetry(T)}.
stat_command_count(Count) :- Count = #count{C : command(C)}.
issue_count_critical(Count) :- Count = #count{I1, I2 : design_issue("cyclic_dependency", I1, I2)}.
issue_count_warning(Count) :- Count = #count{Args : design_issue(Type, Args), Type != "cyclic_dependency"}.
#show has_temperature_telemetry/1.
#show hub_interface/2.
#show can_communicate/3.
#show similar_interfaces/3.
#show design_issue/2.
#show design_issue/3.
#show design_issue/4.
#show design_issue/6.
#show stat_interface_count/1.
#show stat_relationship_count/1.
#show stat_property_count/1.
#show stat_telemetry_count/1.
#show stat_command_count/1.
#show issue_count_critical/1.
#show issue_count_warning/1.
