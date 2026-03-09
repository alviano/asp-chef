The **@config/Unregister Javascript** operation removes operations from the local storage of the browser.

**Important!** Button UNREGISTER or UNREGISTER ALL must be clicked. The **Operations** panel is updated after a refresh or after modifying the filter, also for other recipes.

Note that this operation is intended as a way to configure and customize ASP Chef. **It is strongly suggested to unregister operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.**

§§§§

This operation allows you to clean up your workspace by removing custom JavaScript operations that you have previously registered.

#### How it works

The operation interacts with the browser's `localStorage`, where the definitions of your custom operations are kept. Since `localStorage` is persistent across sessions and shared between different recipes on the same domain, unregistering an operation here will remove it from all your ASP-chef recipes.

#### Usage Scenario: Maintenance

If you have registered many experimental operations or if a remote URL is no longer valid, use this ingredient to:
1.  **Select** the operations you want to remove from the provided list.
2.  **Click** the **UNREGISTER** button to perform the removal.
3.  **Refresh** the page or update the sidebar filter to see the changes.

#### Safety Note

Unregistering an operation will not break recipes that already contain an ingredient of that type, but you won't be able to add *new* instances of that operation until you register it again.

