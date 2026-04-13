---
name: vitest-unit-test
description: Generate a Vitest unit test for a Hapi route handler, controller, or service function. Use when writing or adding tests to an existing module — produces a test file with describe/it blocks, mocks for downstream services and the Hapi toolkit, and assertions covering the happy path, validation errors, and service failures to meet the 90%+ coverage requirement.
license: OGL-UK-3.0
---

# Vitest Unit Test Scaffold

Read the module under test first to understand its shape, then generate a test file covering all branches.

## File location

Place the test file next to the module it tests:

- `app/routes/my-route.test.js` alongside `app/routes/my-route.js`
- Or in a `__tests__/` directory mirroring the source tree

## Base structure

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../routes/my-route.js'

describe('myRoute', () => {
  describe('GET handler', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders the view with empty form state', async () => {
      // Arrange — Act — Assert
    })
  })
})
```

## Mocking the Hapi toolkit

```js
const mockH = {
  view: vi.fn().mockReturnValue('view-response'),
  redirect: vi.fn().mockReturnValue('redirect-response')
}

const mockRequest = {
  payload: {},
  params: {},
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}
```

## Mocking downstream services

```js
vi.mock('../../services/my-service.js', () => ({
  getItems: vi.fn()
}))

import { getItems } from '../../services/my-service.js'

beforeEach(() => {
  getItems.mockResolvedValue([{ id: 1, name: 'Item' }])
})
```

## Coverage targets

- ≥90% overall; ≥95% for route handlers and controllers
- 100% for error handling paths and any security-critical logic
- Write a case for every branch: happy path, validation error, service error, edge cases

## Patterns to cover

### GET — renders view

```js
it('renders the view with empty form state', async () => {
  await handler(mockRequest, mockH)

  expect(mockH.view).toHaveBeenCalledWith('view-name', {
    errorList: [],
    fieldErrors: {},
    values: {}
  })
})
```

### POST — valid payload redirects

```js
it('redirects to the next page on valid submission', async () => {
  mockRequest.payload = { name: 'Jane Smith' }

  await handler(mockRequest, mockH)

  expect(mockH.redirect).toHaveBeenCalledWith('/next-page')
})
```

### POST — invalid payload re-renders with errors

```js
it('re-renders with validation errors on empty submission', async () => {
  mockRequest.payload = { name: '' }

  await handler(mockRequest, mockH)

  expect(mockH.view).toHaveBeenCalledWith(
    'view-name',
    expect.objectContaining({
      errorList: expect.arrayContaining([
        expect.objectContaining({ text: 'Enter your full name', href: '#name' })
      ]),
      fieldErrors: expect.objectContaining({
        name: expect.objectContaining({ text: 'Enter your full name' })
      }),
      values: { name: '' }
    })
  )
})
```

### Service throws — error propagates

```js
it('throws when the service fails', async () => {
  getItems.mockRejectedValue(new Error('upstream failure'))

  await expect(handler(mockRequest, mockH)).rejects.toThrow('upstream failure')
})
```

### Service returns empty / not-found

```js
it('renders a not-found view when the item does not exist', async () => {
  getItems.mockResolvedValue(null)

  await handler({ ...mockRequest, params: { id: 'unknown' } }, mockH)

  expect(mockH.view).toHaveBeenCalledWith('not-found', expect.any(Object))
})
```

## References

- [Vitest API](https://vitest.dev/api/)
- [Vitest mocking](https://vitest.dev/guide/mocking.html)
- [Defra quality assurance standards](https://github.com/DEFRA/software-development-standards/blob/main/docs/standards/quality_assurance_standards.md)
