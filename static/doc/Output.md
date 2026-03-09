The **Output** operation shows the output of the previous operation.

The input is echoed in output.

§§§§

The **Output** ingredient provides a formatted text view of the atoms in each model of the current input.

#### How it works

It simply iterates through each model and prints its atoms. Each model is usually displayed within its own container or separated visually to help distinguish between multiple solutions.

#### Use Case: Debugging and Inspection

While specialized visualization ingredients (like **Graph**, **Table**, or **Markdown**) are often preferred for final results, the **Output** ingredient is indispensable for:
- **Baseline inspection**: Seeing the raw results of a logic program.
- **Traceability**: Adding multiple **Output** ingredients at different stages of a complex recipe to see how facts are transformed.
- **Verification**: Ensuring that predicates created by intermediate operations (like **Wrap** or **Encode**) look as expected.

#### Relationship with other Visualization operations

It is common to keep an **Output** ingredient at the very bottom of a recipe or immediately following a **Search Models** step to have a constant textual overview of the data being processed.

