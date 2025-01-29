The **Lua String @-terms** operation extends models in input with some encoded Lua content.

The definitions are base64 encoded and wrapped by predicate `__base64__`.

The name of the unary predicate `__base64__` can be specified in the recipe. 
Moreover, the prefix of the @-terms defined by this operation can be customized.

Details are provided in the extended documentation.

§§§§

#### Implemented @-terms

##### String Concatenation
* `@string_join(sep, ...)` - concatenates two or more strings using the provided separator
* `@string_concat(...)` - shortcut for `@string_join("", ...)`

##### String Length
* `@string_len(s)` - returns the length of the string `s`

##### String Substring
* `@string_sub(s, i, j)` - returns a substring of `s` starting at index `i` and ending at index `j`

##### String Pattern Matching
* `@string_find(s, pattern, init)` - finds the first occurrence of `pattern` in `s` starting at index `init`
* `@string_match(s, pattern, init)` - returns the first capture of `pattern` in `s` starting at index `init`
* `@string_gmatch(s, pattern)` - returns an iterator function that returns each capture of `pattern` in `s`
* `@string_gsub(s, pattern, repl)` - replaces each occurrence of `pattern` in `s` with `repl`

##### String Conversion
* `@string_byte(s, i)` - returns the byte value of the character at index `i` in `s`
* `@string_char(byte)` - returns a string containing the character represented by `byte`
* `tonumber(s, base)` - converts `s` to a number using the given `base` (default is 10)
* `tostring(value)` - converts `value` to a string

##### String Formatting
* `@string_format(format, ...)` - formats a string using the given format string and arguments
* `@string_rep(s, n)` - returns a string consisting of `n` repetitions of `s`

##### String Utility
* `@string_lower(s)` - returns a copy of `s` with all characters converted to lowercase
* `@string_upper(s)` - returns a copy of `s` with all characters converted to uppercase
* `@string_reverse(s)` - returns a copy of `s` with the characters in reverse order
