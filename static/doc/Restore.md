The **Restore** operation restores some input stored in memory.

The ID of the associated _Store_ ingredient must be specified. Note that the _Store_ ingredient is expected to precede the **{operation}** ingredient (and not be hidden inside a _Recipe_ ingredient); such a condition is not checked, but deviating from it will result in unexpected behavior (the content stored in the previous iteration is restored, an error is raised at the first iteration, the explosion of a _Recipe_ ingredient will not work properly, and so on).

The input of the ingredient can be dropped (the default) or echoed. In the latter case the cartesian product of the input and the restored content is produced in output.
