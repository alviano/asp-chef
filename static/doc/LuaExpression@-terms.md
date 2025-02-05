The **Lua Expression @-terms** operation extends models in input with some encoded Lua content.

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe. 
Moreover, the prefix of the @-terms defined by this operation can be customized.

The provided @-terms target (arithmetic) expressions.
Details are provided in the extended documentation.

§§§§

#### Implemented @-terms

##### Expression Evaluation
* `@expr(...)` - concatenates the arguments to obtain an expression, and returns its evaluation
* `@exprf(format, ...)` - evaluates the format string to obtain an expression, whose evaluation is returned

##### Expressions as Strings
* `@expr_string(...)` - returns the string evaluated by `@expr(...)`
* `@exprf_string(format, ...)` - returns the string evaluated by `@exprf(format, ...)`


Expressions are evaluated in a restricted environment.
The following functions and modules are accessible:
* `tostring()` - converts its argument to a string
* `tonumber()` - converts its argument to a number 
* `math` - built-in module for mathematics, including (among other functions)
  * `math.abs(x)` - returns the absolute value of `x`
  * `math.acos(x)` - returns the arc cosine of `x` in radians
  * `math.ceil(x)` - returns the smallest integer greater than or equal to `x`
* `string` - built-in module for strings, including (among other functions)
  * `string.byte(s, i, j) - returns the ASCII code of characters in string `s` from index `i` to `j`
  * `string.char(...)` - converts ASCII codes into a string
  * `string.reverse(s)` - reverses the string `s`
  * `string.sub(s, i, j)` - extracts a substring from `s` starting at `i` and ending at `j`
  * `string.upper(s)` - converts all characters in `s` to uppercase
 
Real numbers are represented in the format `real("NUMBER")`.
For example, the following program
```asp
pi(@expr("math.pi")).
two_pi(@expr("2 * math.pi")).
equal :- pi(PI), two_pi(@expr("2 * ", PI)).
equal' :- pi(PI), two_pi(@exprf("2 * %s", PI)).
equal''(@exprf("%.16f == 2 * %.16f", PI2, PI)) :- pi(PI), two_pi(PI2).
```
has answer set
```asp
pi(real("3.1415926535898")).
two_pi(real("6.2831853071796")).
equal.
equal'.
equal''(true).
```

Take into account that real numbers are converted back and forth from strings, and this may introduce errors due to approximations.
For example, use the program
```asp
approx(I, @exprf(@string_concat("%.", I, "f"), PI)) :- PI = @expr("math.pi"), I = 0..16.
```
combined with the **Lua String @-terms** to obtain the following answer set:
```asp
approx(0,3).
approx(1,real("3.1")).
approx(2,real("3.14")).
approx(3,real("3.142")).
approx(4,real("3.1416")).
approx(5,real("3.14159")).
approx(6,real("3.141593")).
approx(7,real("3.1415927")).
approx(8,real("3.14159265")).
approx(9,real("3.141592654")).
approx(10,real("3.1415926536")).
approx(11,real("3.14159265359")).
approx(12,real("3.14159265359")).
approx(13,real("3.1415926535898")).
approx(14,real("3.1415926535898")).
approx(15,real("3.1415926535898")).
approx(16,real("3.1415926535898")).
```
It can be noted that we are having a precision of around 13-14 digits. 