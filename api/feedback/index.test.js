/**
 * Unit tests for POST /api/feedback
 *
 * Written against Tank's FIXED implementation which uses:
 * - @azure/cosmos SDK (lazy-init via getCosmosContainer())
 * - Optional chaining for App Insights (client?.trackEvent)
 * - typeof + Array.isArray validation
 * - Early return on validation failure
 * - Env-var guarded App Insights setup
 */

// ── Mock references (declared before jest.mock) ──────────────────────────

let mockTrackEvent;
let mockTrackException;
let mockAppInsightsSetup;
let mockCosmosCreate;
let mockCosmosClient;

// Store original env to restore after each test
const originalEnv = { ...process.env };

beforeEach(() => {
  mockTrackEvent = jest.fn();
  mockTrackException = jest.fn();
  mockAppInsightsSetup = jest.fn().mockReturnThis();
  mockCosmosCreate = jest.fn().mockResolvedValue({ resource: { id: 'test-id' } });

  // Build the Cosmos mock chain matching Tank's lazy-init pattern:
  // new CosmosClient(connStr) → .databases.createIfNotExists() → { database }
  // database.containers.createIfNotExists() → { container }
  // container.items.create(doc)
  const mockContainer = { items: { create: mockCosmosCreate } };
  const mockDatabase = {
    containers: {
      createIfNotExists: jest.fn().mockResolvedValue({ container: mockContainer }),
    },
  };
  mockCosmosClient = jest.fn().mockImplementation(() => ({
    databases: {
      createIfNotExists: jest.fn().mockResolvedValue({ database: mockDatabase }),
    },
  }));

  // Set env vars so handler initializes Cosmos and App Insights
  process.env.COSMOSDB_CONNECTION_STRING = 'AccountEndpoint=https://fake.documents.azure.com:443/;AccountKey=fakekey==;';
  process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=fake-key';
});

afterEach(() => {
  // Restore original env
  process.env = { ...originalEnv };
});

// ── Helpers ───────────────────────────────────────────────────────────────

function createMockContext(overrides = {}) {
  const log = jest.fn();
  log.error = jest.fn();
  log.warn = jest.fn();
  log.info = jest.fn();
  log.verbose = jest.fn();
  return {
    log,
    res: null,
    bindings: {},
    traceContext: { traceparent: 'test-trace-id-123' },
    done: jest.fn(),
    ...overrides,
  };
}

function createMockReq(body, headers = {}) {
  return { body, headers };
}

function base64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

/**
 * Load the handler inside an isolated module scope so module-level
 * side effects (appInsights.setup, CosmosClient lazy-init) pick up
 * the current test's mocks. Each call resets the module cache.
 */
function loadHandler(appInsightsOverride) {
  jest.resetModules();
  let handler;
  jest.isolateModules(() => {
    jest.doMock('applicationinsights', () => {
      const client = appInsightsOverride !== undefined
        ? appInsightsOverride
        : { trackEvent: mockTrackEvent, trackException: mockTrackException };
      return {
        setup: mockAppInsightsSetup,
        start: jest.fn().mockReturnThis(),
        defaultClient: client,
      };
    });
    jest.doMock('@azure/cosmos', () => ({
      CosmosClient: mockCosmosClient,
    }), { virtual: true });
    handler = require('./index');
  });
  return handler;
}

/**
 * Variant loader that makes appInsights.setup() throw at module load.
 * Verifies the handler's try/catch around setup() works.
 */
function loadHandlerWithSetupCrash() {
  jest.resetModules();
  let handler;
  jest.isolateModules(() => {
    jest.doMock('applicationinsights', () => ({
      setup: jest.fn(() => { throw new Error('App Insights init failed'); }),
      start: jest.fn().mockReturnThis(),
      defaultClient: null,
    }));
    jest.doMock('@azure/cosmos', () => ({
      CosmosClient: mockCosmosClient,
    }), { virtual: true });
    handler = require('./index');
  });
  return handler;
}

/**
 * Azure Functions treats missing status as 200. This helper checks
 * that the response indicates success (either explicit 200 or no status).
 */
function expectSuccessStatus(res) {
  expect(res.status === 200 || res.status === undefined).toBe(true);
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Validation', () => {
  test('returns 400 when body is null', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(null);

    await handler(context, req);

    expect(context.res.status).toBe(400);
    expect(context.res.body).toBeDefined();
  });

  test('returns 400 when body is undefined', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(undefined);

    await handler(context, req);

    expect(context.res.status).toBe(400);
    expect(context.res.body).toBeDefined();
  });

  test('returns 400 when body is a string', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq('not an object');

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  test('returns 400 when body is a number', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(42);

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  test('returns 400 when body is an array', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq([1, 2, 3]);

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  test('returns 400 when bpm field is missing', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ isCorrect: true });

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  test('returns 400 when isCorrect field is missing', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120 });

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  test('does NOT attempt Cosmos write on validation failure', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(null);

    await handler(context, req);

    expect(mockCosmosCreate).not.toHaveBeenCalled();
  });

  test('tracks exception to App Insights on validation failure', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120 }); // missing isCorrect

    await handler(context, req);

    expect(mockTrackException).toHaveBeenCalledWith(
      expect.objectContaining({
        exception: expect.any(Error),
      })
    );
  });

  test('does NOT track feedback_save event on validation failure', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(null);

    await handler(context, req);

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  test('early return: validation failure triggers ALL expected side effects', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ isCorrect: true }); // missing bpm

    await handler(context, req);

    // ALL four early-return assertions in one test
    expect(context.res.status).toBe(400);
    expect(context.res.body).toBeDefined();
    expect(mockTrackException).toHaveBeenCalledTimes(1);
    expect(mockCosmosCreate).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS PATH TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Success path', () => {
  test('returns success with thank-you message on valid request', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    expectSuccessStatus(context.res);
    expect(context.res.body).toEqual(
      expect.objectContaining({ message: 'Thank you!' })
    );
  });

  test('writes document to Cosmos DB on valid request', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 140, isCorrect: false });

    await handler(context, req);

    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
    const doc = mockCosmosCreate.mock.calls[0][0];
    expect(doc).toEqual(
      expect.objectContaining({
        bpm: 140,
        isCorrect: false,
      })
    );
  });

  test('tracks feedback_save event to App Insights on valid request', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'feedback_save',
      })
    );
  });

  test('includes clientPrincipal in response body', async () => {
    const principal = { userId: 'user-1', userRoles: ['authenticated'] };
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(
      { bpm: 120, isCorrect: true },
      { 'x-ms-client-principal': base64Encode(principal) }
    );

    await handler(context, req);

    expect(context.res.body.clientPrincipal).toEqual(principal);
  });

  // Falsy-valid cases — catches bad validation like `if (!bpm)`
  test('accepts bpm of 0 as valid', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 0, isCorrect: true });

    await handler(context, req);

    expectSuccessStatus(context.res);
    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
  });

  test('accepts isCorrect of false as valid', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: false });

    await handler(context, req);

    expectSuccessStatus(context.res);
    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT PRINCIPAL TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Client principal', () => {
  test('extracts client principal from x-ms-client-principal header', async () => {
    const principal = {
      identityProvider: 'github',
      userId: 'abc-123',
      userDetails: 'testuser',
      userRoles: ['authenticated', 'anonymous'],
    };
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(
      { bpm: 120, isCorrect: true },
      { 'x-ms-client-principal': base64Encode(principal) }
    );

    await handler(context, req);

    expectSuccessStatus(context.res);
    expect(context.res.body.clientPrincipal).toEqual(principal);
  });

  test('handles missing client principal header gracefully', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true }, {});

    await handler(context, req);

    // Should still succeed — clientPrincipal will be empty object
    expectSuccessStatus(context.res);
    expect(context.res.body.message).toBe('Thank you!');
  });

  test('handles garbage base64 in client principal header gracefully', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq(
      { bpm: 120, isCorrect: true },
      { 'x-ms-client-principal': '!!!not-valid-base64!!!' }
    );

    await handler(context, req);

    // Should not crash — graceful degradation
    expectSuccessStatus(context.res);
  });

  test('handles valid base64 of invalid JSON gracefully', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const invalidJsonBase64 = Buffer.from('not json at all').toString('base64');
    const req = createMockReq(
      { bpm: 120, isCorrect: true },
      { 'x-ms-client-principal': invalidJsonBase64 }
    );

    await handler(context, req);

    // Should not crash — graceful degradation
    expectSuccessStatus(context.res);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// APP INSIGHTS RESILIENCE
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — App Insights resilience', () => {
  test('function works when App Insights client is null', async () => {
    // Simulate defaultClient being null (App Insights unavailable)
    const handler = loadHandler(null);
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    // Should not throw — optional chaining handles null client
    await handler(context, req);
    expectSuccessStatus(context.res);
    expect(context.res.body.message).toBe('Thank you!');
  });

  test('validation failure does not crash when App Insights client is null', async () => {
    const handler = loadHandler(null);
    const context = createMockContext();
    const req = createMockReq(null);

    await handler(context, req);
    expect(context.res.status).toBe(400);
  });

  test('function works when APPLICATIONINSIGHTS_CONNECTION_STRING is not set', async () => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    delete process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);
    expectSuccessStatus(context.res);
    // App Insights setup should not have been called without env vars
    expect(mockAppInsightsSetup).not.toHaveBeenCalled();
  });

  test('handler survives appInsights.setup() throwing at module load', async () => {
    // Env var IS set, so the handler enters the setup branch — but setup() throws
    const handler = loadHandlerWithSetupCrash();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);
    expectSuccessStatus(context.res);
    expect(context.res.body.message).toBe('Thank you!');
  });

  test('validation still works when appInsights.setup() threw at module load', async () => {
    const handler = loadHandlerWithSetupCrash();
    const context = createMockContext();
    const req = createMockReq(null);

    await handler(context, req);
    expect(context.res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COSMOS DB ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Cosmos DB error handling', () => {
  test('returns 500 when Cosmos DB write fails', async () => {
    mockCosmosCreate.mockRejectedValueOnce(new Error('Cosmos write failed'));

    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    expect(context.res.status).toBe(500);
    expect(context.res.body).toBeDefined();
  });

  test('logs error when Cosmos DB write fails', async () => {
    mockCosmosCreate.mockRejectedValueOnce(new Error('Network timeout'));

    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    expect(context.log.error).toHaveBeenCalled();
  });

  test('skips Cosmos write when no connection string is configured', async () => {
    delete process.env.COSMOSDB_CONNECTION_STRING;
    delete process.env.bpmcounterdbaccount_DOCUMENTDB;

    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    // Should still succeed but not attempt Cosmos write
    expectSuccessStatus(context.res);
    expect(mockCosmosCreate).not.toHaveBeenCalled();
    expect(context.log.warn).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TELEMETRY CORRELATION
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Telemetry correlation', () => {
  test('sets ai.operation.id from context.traceContext.traceparent on success', async () => {
    const handler = loadHandler();
    const context = createMockContext({ traceContext: { traceparent: 'my-trace-abc' } });
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tagOverrides: expect.objectContaining({
          'ai.operation.id': 'my-trace-abc',
        }),
      })
    );
  });

  test('sets ai.operation.id from context.traceContext.traceparent on validation failure', async () => {
    const handler = loadHandler();
    const context = createMockContext({ traceContext: { traceparent: 'my-trace-xyz' } });
    const req = createMockReq(null);

    await handler(context, req);

    expect(mockTrackException).toHaveBeenCalledWith(
      expect.objectContaining({
        tagOverrides: expect.objectContaining({
          'ai.operation.id': 'my-trace-xyz',
        }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DATA INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/feedback — Data integrity', () => {
  test('Cosmos document contains bpm and isCorrect from request', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 95, isCorrect: false });

    await handler(context, req);

    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
    const doc = mockCosmosCreate.mock.calls[0][0];
    expect(doc.bpm).toBe(95);
    expect(doc.isCorrect).toBe(false);
    expect(doc.id).toBeDefined();
    expect(typeof doc.id).toBe('string');
    expect(doc.id.length).toBeGreaterThan(0);
  });

  test('document has a valid numeric timestamp', async () => {
    const before = Date.now();
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);
    const after = Date.now();

    const doc = mockCosmosCreate.mock.calls[0][0];
    expect(typeof doc.timestamp).toBe('number');
    expect(doc.timestamp).toBeGreaterThanOrEqual(before);
    expect(doc.timestamp).toBeLessThanOrEqual(after);
  });

  test('document ID used in Cosmos write matches telemetry event', async () => {
    const handler = loadHandler();
    const context = createMockContext();
    const req = createMockReq({ bpm: 120, isCorrect: true });

    await handler(context, req);

    const cosmosDoc = mockCosmosCreate.mock.calls[0][0];
    const telemetryCall = mockTrackEvent.mock.calls[0][0];

    expect(cosmosDoc.id).toBe(telemetryCall.properties.id);
  });
});
