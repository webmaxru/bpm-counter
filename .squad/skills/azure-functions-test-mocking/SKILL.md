---
name: "azure-functions-test-mocking"
description: "Patterns for unit testing Azure Functions with Jest, including module isolation for side-effect-heavy handlers"
domain: "testing"
confidence: "high"
source: "earned"
---

## Context
Azure Functions handlers often have module-scope side effects (App Insights setup, database client init). Standard `jest.mock()` doesn't reset between tests, causing cross-test pollution. This skill covers the isolation pattern.

## Patterns

### 1. Module isolation via `jest.resetModules()` + `jest.isolateModules()`
```javascript
function loadHandler(mockOverrides) {
  jest.resetModules(); // Clear stale module-scope state
  let handler;
  jest.isolateModules(() => {
    jest.doMock('applicationinsights', () => ({ /* mocks */ }));
    jest.doMock('@azure/cosmos', () => ({ /* mocks */ }), { virtual: true });
    handler = require('./index');
  });
  return handler;
}

// Variant: test what happens when setup() THROWS at module load
function loadHandlerWithSetupCrash() {
  jest.resetModules();
  let handler;
  jest.isolateModules(() => {
    jest.doMock('applicationinsights', () => ({
      setup: jest.fn(() => { throw new Error('Init failed'); }),
      defaultClient: null,
    }));
    jest.doMock('@azure/cosmos', () => ({ /* mocks */ }), { virtual: true });
    handler = require('./index');
  });
  return handler;
}
```
- Call `loadHandler()` in each test for fresh module scope
- Use `jest.doMock()` (not `jest.mock()`) inside `isolateModules`
- Add `{ virtual: true }` for packages not yet installed
- `jest.resetModules()` before `isolateModules` is defensive best practice

### 2. Mock Azure Functions context
```javascript
function createMockContext(overrides = {}) {
  const log = jest.fn();
  log.error = jest.fn();
  log.warn = jest.fn();
  log.info = jest.fn();
  return {
    log, res: null, bindings: {},
    traceContext: { traceparent: 'test-trace-id' },
    done: jest.fn(),
    ...overrides,
  };
}
```

### 3. Falsy-valid edge cases
Always test `{ bpm: 0, isCorrect: false }` to catch truthy-based validation bugs.

### 4. Client principal header testing
```javascript
function base64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}
// Test: valid, missing, garbage base64, valid-base64-of-invalid-JSON
```

### 5. Comprehensive early-return validation test
```javascript
test('early return triggers ALL expected side effects', async () => {
  const handler = loadHandler();
  const context = createMockContext();
  const req = createMockReq({ isCorrect: true }); // missing bpm

  await handler(context, req);

  expect(context.res.status).toBe(400);        // correct status
  expect(mockTrackException).toHaveBeenCalled(); // exception tracked
  expect(mockCosmosCreate).not.toHaveBeenCalled(); // NO database write
  expect(mockTrackEvent).not.toHaveBeenCalled();   // NO success event
});
```

## Anti-Patterns
- **Top-level `jest.mock()` for module-scope side effects** — leads to cached mocks across tests
- **Asserting `context.done()` was called** — modern async functions should `return`, not `context.done()`
- **Defaulting `body = {}` in request helpers** — hides the "missing body" edge case
- **Skipping `{ virtual: true }`** — tests crash if mocked package isn't installed
