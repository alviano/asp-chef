The **@config/Unregister Recipes** operation removes operations from the local storage of the browser.

**Important!** Button UNREGISTER or UNREGISTER ALL must be clicked. The **Operations** panel is updated after a refresh or after modifying the filter, also for other recipes.

Note that this operation is intended as a way to configure and customize ASP Chef. **It is strongly suggested to unregister operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.**

§§§§

This operation is used to manage and remove custom Recipe-based operations that have been registered in your browser.

#### Managing Your Toolbox

Custom recipes registered as operations are stored in the browser's persistent storage. Over time, you may want to remove old versions or unused recipes to keep your sidebar organized.

#### Steps to Unregister

1.  Add the **@config/Unregister Recipes** ingredient.
2.  Choose the recipes to remove from the list of registered custom operations.
3.  Click **UNREGISTER** to remove the selected ones, or **UNREGISTER ALL** for a full reset.
4.  The change is finalized when you refresh or interact with the operations search filter.

#### Global Effect

Because registration is tied to the browser's `localStorage`, removing a recipe here will make it unavailable for selection in all other recipes opened in the same browser.

