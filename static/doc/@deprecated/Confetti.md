**Warning!**
Deprecated operation.
Use the **Confetti.js** operation. 

----

The **@deprecated/Confetti** operation shows a particles animation.

One call to the `confetti()` function if a configuration object (in JSON) is provided, and for each instance of the specified predicate (if any).

Go to https://confetti.js.org/more.html to find inspiration!

**Attention!** This operation is also an example of how to use dynamic imports to avoid a strong binding for operations that are not expected to be used frequently.

§§§§

Any example in the confetti.js.org website can be adapted for ASP Chef by removing the call to the `confetti()` function, and encoding the object passed as argument in JSON.

For example
```javascript
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
})
```
becomes
```javascript
{
  "particleCount": 100,
  "spread": 70,
  "origin": { "y": 0.6 }
}
```
