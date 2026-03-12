The **Restore** operation restores some input stored in memory.

The ID of the associated **Store** ingredient must be specified. Note that the **Store** ingredient is expected to precede the **Restore** ingredient (and not be hidden inside a **Recipe** ingredient); such a condition is not checked, but deviating from it will result in unexpected behavior (the content stored in the previous iteration is restored, an error is raised at the first iteration, the explosion of a **Recipe** ingredient will not work properly, and so on).

The input of the ingredient can be dropped (the default) or echoed. In the latter case the cartesian product of the input and the restored content is produced in output.

§§§§

This operation retrieves models previously saved by a **Store** ingredient, enabling non-linear data flows and sophisticated model combinations.

#### Input Handling

You can control how the restored models interact with the current models in the pipeline:

*   **Echo Input (Off)**: The current models are discarded and replaced entirely by the restored models.
*   **Echo Input (On)**: The operation computes the **Cartesian Product** of the current input models and the restored models. If you have 2 models in the current input and restore 3 models from memory, you will end up with 6 models in the output.

#### Usage Scenario: Multi-Stage Analysis

1.  **Store**: Save a set of "baseline" facts (e.g., ID: `baseline`).
2.  **Logic Program A**: Process data to find one type of result.
3.  **Restore**: Retrieve the `baseline` facts with **Echo Input** enabled to combine the new results with the original facts for further analysis.

#### Connection by ID

To use **Restore**, you must provide the unique **ID** of a preceding **Store** ingredient. You can quickly copy this ID to your clipboard using the button provided in the **Store** ingredient's interface.

