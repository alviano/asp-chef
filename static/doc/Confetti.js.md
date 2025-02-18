The **Confetti.js** operation shows a particles animation.

For each instance of the specified predicate, function `confetti()` is called using the Base64-encoded configuration object (a relaxed JSON). 


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
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
}
```
