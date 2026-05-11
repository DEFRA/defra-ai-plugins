---
name: jsdoc-comments
description: Write or review JSDoc (and TSDoc, where an approved TypeScript exception applies) for JavaScript modules in a Defra Hapi + Nunjucks service. Use when adding type annotations to an exported function, when triaging stale doc comments during a review, or when deciding whether a doc block is warranted at all.
license: OGL-UK-3.0
---

# JSDoc / TSDoc Conventions

The frontend-developer agent prompt requires JSDoc for type annotations and the `pre-commit-review` skill checks that public functions carry JSDoc. This skill defines _how_ those doc comments should be written and reviewed.

The Defra stack default is vanilla JavaScript — TypeScript needs an approved exception. JSDoc is therefore the primary surface; the TSDoc rules at the bottom apply only when the exception has been granted.

## When to write a doc comment

Default to **no comment**. Add JSDoc only when:

- The function is exported and its parameter constraints or return shape are non-obvious from the signature alone.
- There is a genuine "why" that naming and types cannot express.

Do not add JSDoc for:

- Internal helpers whose signature is self-explanatory.
- Trivial arrow functions used in one place.
- Anything where the doc would just restate the function name.

A function with no doc comment is fine. A function with a doc comment that no longer matches the code is actively misleading — worse than no comment.

## Block format

Use `/** ... */`. Never use `//` line comments as a doc block.

```js
/**
 * Calculates the total cost including VAT.
 *
 * @param {number} subtotal - Pre-tax amount in pence.
 * @param {number} vatRate - VAT rate as a decimal (0.2 = 20%).
 * @returns {number} Total amount in pence including VAT.
 * @throws {RangeError} If `subtotal` is negative.
 */
const totalWithVat = (subtotal, vatRate) => { ... }
```

The first sentence is a present-tense summary of the current behaviour. Blank line, then tags.

## Tags

### `@param`

```
@param {type} name - description
```

- The name must exactly match the parameter name in the signature. If the parameter is renamed, update the tag.
- Include `{type}` in `.js` files — that is the whole point of the tag.
- Optional parameters use `[name]`: `@param {string} [locale]`.
- Default values use `[name=default]`: `@param {number} [page=1]`.
- For destructured parameter objects, document each property:

  ```js
  /**
   * @param {{ id: string, role: string }} user
   */
  ```

### `@returns`

```
@returns {type} description
```

- Omit entirely for functions that return `undefined` or exist only for side effects.
- The `{type}` must match what `return` statements actually produce.
- If the function can return `null` or `undefined`, reflect that: `{User | null}`.
- For `async` functions, the return type is the resolved value — `@returns {Promise<User>}` is correct; the inner value (`{User}`) is not.

### `@throws`

```
@throws {ErrorType} condition under which this is thrown
```

- Only include if the function **explicitly throws**, not if a callee might throw.
- `{ErrorType}` must match the actual constructor used (`RangeError`, `Boom.badRequest`, a custom class).
- If the throw is removed, remove the tag.

### `@typedef`

Use to name a complex shape once and reference it elsewhere. Place at the top of the module.

```js
/**
 * @typedef {object} ErrorListItem
 * @property {string} text
 * @property {string} href
 */
```

### `@async`

Optional and usually redundant — the `async` keyword in the signature already conveys it. Add only when the function returns a Promise but is not declared `async`.

## Accuracy rules

A doc comment is a contract. Every claim it makes must be true of the current code.

| Failure mode     | Example                                                               |
| ---------------- | --------------------------------------------------------------------- |
| Parameter drift  | `@param` documents a renamed, removed, or added parameter.            |
| Return mismatch  | `@returns` describes a type or shape the function no longer produces. |
| Phantom throws   | `@throws` documents an exception the function no longer raises.       |
| Wrong throw type | `@throws {TypeError}` but the function throws `RangeError`.           |
| Stale summary    | First sentence describes a previous responsibility of the function.   |

Severity for reviewers:

| Severity | When                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| **FAIL** | Wrong param name; `@returns` flatly wrong; documented `@throws` for a removed exception. |
| **WARN** | Summary is vague or partially outdated; `@returns` present on a void function.           |
| **PASS** | Doc comment is accurate, or no doc comment exists.                                       |

## Review checklist

When reviewing a `/** ... */` block:

- [ ] Every `@param name` matches an actual parameter in the signature.
- [ ] No `@param` exists for a parameter that has been removed.
- [ ] Every exported function with non-obvious parameters has a `@param` per parameter.
- [ ] `@returns {type}` matches what the function actually returns (including `null` / `undefined` if applicable).
- [ ] No `@returns` on a function that returns nothing.
- [ ] `@throws {ErrorType}` matches the constructor in `throw new ErrorType(...)`.
- [ ] No `@throws` for an error the function no longer throws.
- [ ] First sentence describes current behaviour, not a previous version.
- [ ] Optional and defaulted parameters use `[name]` or `[name=default]`.

## When to fix versus delete

- **Fix** the comment if it documents a genuine contract consumers need — parameter constraints, return shape, thrown exceptions.
- **Delete** the comment if fixing it would produce nothing beyond what the function signature already says. A comment that just restates the name adds no value.

## TSDoc (TypeScript, exception only)

If an approved exception permits `.ts` in a project, the rules above apply with two differences:

- Type information lives in the signature. Do not duplicate it in `@param {type}` — omit the type or omit the `@param` entirely if the description adds nothing.
- The `@returns` line should describe meaning, not type, for the same reason.

```ts
/**
 * @param name - Display name; trimmed before persistence.
 */
const createUser = async (name: string): Promise<User> => { ... }
```

If there is nothing meaningful to say beyond what the names and types already convey, omit the doc block.

## References

- [JSDoc reference](https://jsdoc.app/)
- [TSDoc](https://tsdoc.org/) — for the rare TypeScript-exception project.
