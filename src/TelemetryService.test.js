/**
 * TelemetryService unit tests
 *
 * Uses jest.mock (hoisted) for @microsoft SDK packages and
 * jest.resetModules() + require() per test to get a fresh
 * TelemetryService module with clean module-scope state.
 *
 * Tests marked "validates Px #N fix" assert CORRECT post-fix behavior.
 * They may fail on pre-fix code  that is expected and intentional.
 */

// Mutable container for captured config (const with mock prefix for babel hoisting)
const mockCapturedConfig = { current: null };
const mockNotificationListeners = { current: [] };
const mockAppInsightsInstance = {
  loadAppInsights: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  trackMetric: jest.fn(),
  addTelemetryInitializer: jest.fn(),
  addNotificationListener: jest.fn((listener) => {
    mockNotificationListeners.current.push(listener);
  }),
  config: {},
};

jest.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: jest.fn((args) => {
    mockCapturedConfig.current = args.config;
    mockAppInsightsInstance.config = args.config;
    return mockAppInsightsInstance;
  }),
  SeverityLevel: { Error: 3, Warning: 2, Information: 1, Verbose: 0 },
}));

jest.mock('@microsoft/applicationinsights-react-js', () => ({
  ReactPlugin: jest.fn().mockImplementation(() => ({
    identifier: 'ReactPlugin',
  })),
}));

jest.mock('@microsoft/applicationinsights-clickanalytics-js', () => ({
  ClickAnalyticsPlugin: jest.fn().mockImplementation(() => ({
    identifier: 'ClickAnalyticsPlugin',
  })),
}));

jest.mock('react-device-detect', () => ({ isMobile: false }));

describe('TelemetryService', () => {
  const mockHistory = { listen: jest.fn() };
  const testConnString =
    'InstrumentationKey=test-key-00000000-0000-0000-0000-000000000000';

  beforeEach(() => {
    jest.resetModules();
    mockCapturedConfig.current = null;
    mockNotificationListeners.current = [];

    // CRA resetMocks clears mock implementations - re-apply the factory
    const {
      ApplicationInsights,
    } = require('@microsoft/applicationinsights-web');
    ApplicationInsights.mockImplementation((args) => {
      mockCapturedConfig.current = args.config;
      mockAppInsightsInstance.config = args.config;
      return mockAppInsightsInstance;
    });
    mockAppInsightsInstance.addNotificationListener.mockImplementation((listener) => {
      mockNotificationListeners.current.push(listener);
    });
  });

  // Fresh TelemetryService module each test
  const loadModule = () => require('./TelemetryService');

  describe('exports', () => {
    it('initialize is an exported function', () => {
      const { initialize } = loadModule();
      expect(typeof initialize).toBe('function');
    });

    // Validates P0 #1 fix: reactPlugin is exported as a live ReactPlugin
    // Pre-fix: reactPlugin was captured as null by createTelemetryService()
    it('reactPlugin is an exported object (not null)', () => {
      const { reactPlugin } = loadModule();
      expect(reactPlugin).toBeDefined();
      expect(reactPlugin).not.toBeNull();
    });

    it('getAppInsights is an exported function', () => {
      const { getAppInsights } = loadModule();
      expect(typeof getAppInsights).toBe('function');
    });

    it('getAppInsights() returns null before initialization', () => {
      const { getAppInsights } = loadModule();
      expect(getAppInsights()).toBeNull();
    });

    it('parseConnectionString is an exported function', () => {
      const { parseConnectionString } = loadModule();
      expect(typeof parseConnectionString).toBe('function');
    });
  });

  describe('parseConnectionString()', () => {
    it('accepts a valid connection string with all parts', () => {
      const { parseConnectionString } = loadModule();
      const cs = 'InstrumentationKey=abc-123;IngestionEndpoint=https://example.com/;LiveEndpoint=https://live.example.com/';
      const result = parseConnectionString(cs);
      expect(result).toContain('InstrumentationKey=abc-123');
    });

    it('strips trailing slashes from IngestionEndpoint', () => {
      const { parseConnectionString } = loadModule();
      const cs = 'InstrumentationKey=abc-123;IngestionEndpoint=https://example.com/';
      const result = parseConnectionString(cs);
      expect(result).toContain('IngestionEndpoint=https://example.com');
      expect(result).not.toContain('IngestionEndpoint=https://example.com/');
    });

    it('strips trailing slashes from LiveEndpoint', () => {
      const { parseConnectionString } = loadModule();
      const cs = 'InstrumentationKey=abc-123;LiveEndpoint=https://live.example.com/';
      const result = parseConnectionString(cs);
      expect(result).toContain('LiveEndpoint=https://live.example.com');
      expect(result).not.toContain('LiveEndpoint=https://live.example.com/');
    });

    it('leaves endpoint URLs without trailing slash unchanged', () => {
      const { parseConnectionString } = loadModule();
      const cs = 'InstrumentationKey=abc-123;IngestionEndpoint=https://example.com';
      const result = parseConnectionString(cs);
      expect(result).toBe(cs);
    });

    it('accepts a connection string with only InstrumentationKey', () => {
      const { parseConnectionString } = loadModule();
      const cs = 'InstrumentationKey=abc-123';
      expect(() => parseConnectionString(cs)).not.toThrow();
    });

    it('throws when connection string is empty', () => {
      const { parseConnectionString } = loadModule();
      expect(() => parseConnectionString('')).toThrow(/not configured/);
    });

    it('throws when connection string is null', () => {
      const { parseConnectionString } = loadModule();
      expect(() => parseConnectionString(null)).toThrow(/not configured/);
    });

    it('throws when connection string is undefined', () => {
      const { parseConnectionString } = loadModule();
      expect(() => parseConnectionString(undefined)).toThrow(/not configured/);
    });

    it('throws when connection string is missing InstrumentationKey', () => {
      const { parseConnectionString } = loadModule();
      expect(() => parseConnectionString('IngestionEndpoint=https://example.com')).toThrow(/missing InstrumentationKey/);
    });
  });

  describe('initialize()', () => {
    it('creates ApplicationInsights instance with connection string', () => {
      const { initialize } = loadModule();
      const {
        ApplicationInsights,
      } = require('@microsoft/applicationinsights-web');

      initialize(testConnString, mockHistory);

      expect(ApplicationInsights).toHaveBeenCalledTimes(1);
      expect(mockCapturedConfig.current.connectionString).toBe(testConnString);
    });

    it('normalizes connection string endpoint URLs', () => {
      const { initialize } = loadModule();
      const connWithSlash = 'InstrumentationKey=abc-123;IngestionEndpoint=https://example.com/;LiveEndpoint=https://live.example.com/';
      initialize(connWithSlash, mockHistory);
      expect(mockCapturedConfig.current.connectionString).not.toContain('https://example.com/;');
      expect(mockCapturedConfig.current.connectionString).toContain('IngestionEndpoint=https://example.com;');
    });

    it('calls loadAppInsights() after creating instance', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);
      expect(mockAppInsightsInstance.loadAppInsights).toHaveBeenCalledTimes(1);
    });

    it('second call returns cached instance (idempotent)', () => {
      const { initialize } = loadModule();
      const {
        ApplicationInsights,
      } = require('@microsoft/applicationinsights-web');

      const first = initialize(testConnString, mockHistory);
      const second = initialize('InstrumentationKey=other-key', mockHistory);

      expect(first).toBe(second);
      expect(ApplicationInsights).toHaveBeenCalledTimes(1);
    });

    it('succeeds when browserHistory is null (optional param)', () => {
      const { initialize } = loadModule();
      expect(() => initialize(testConnString, null)).not.toThrow();
    });

    it('succeeds when browserHistory is undefined (optional param)', () => {
      const { initialize } = loadModule();
      expect(() => initialize(testConnString, undefined)).not.toThrow();
    });

    it('succeeds when browserHistory is omitted entirely', () => {
      const { initialize } = loadModule();
      expect(() => initialize(testConnString)).not.toThrow();
    });

    it('throws when connectionString is missing', () => {
      const { initialize } = loadModule();
      expect(() => initialize(null, mockHistory)).toThrow(/not configured/);
      expect(() => initialize('', mockHistory)).toThrow(/not configured/);
    });

    it('throws when connectionString lacks InstrumentationKey', () => {
      const { initialize } = loadModule();
      expect(() => initialize('IngestionEndpoint=https://example.com', mockHistory)).toThrow(/missing InstrumentationKey/);
    });

    it('getAppInsights() returns the SDK instance after initialization', () => {
      const { initialize, getAppInsights } = loadModule();
      initialize(testConnString, mockHistory);

      const instance = getAppInsights();
      expect(instance).not.toBeNull();
      expect(instance).toBe(mockAppInsightsInstance);
    });

    // Validates P0 #1 fix: reactPlugin is a live ReactPlugin instance
    it('reactPlugin has ReactPlugin identity', () => {
      const { reactPlugin } = loadModule();
      expect(reactPlugin).not.toBeNull();
      expect(reactPlugin).toHaveProperty('identifier', 'ReactPlugin');
    });
  });

  describe('notification listener', () => {
    it('registers a notification listener after loadAppInsights()', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);
      expect(mockAppInsightsInstance.addNotificationListener).toHaveBeenCalledTimes(1);
    });

    it('listener has eventsDiscarded callback', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);
      const listener = mockNotificationListeners.current[0];
      expect(listener).toBeDefined();
      expect(typeof listener.eventsDiscarded).toBe('function');
    });

    it('eventsDiscarded logs a warning on first call', () => {
      const { initialize } = loadModule();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      initialize(testConnString, mockHistory);

      const listener = mockNotificationListeners.current[0];
      listener.eventsDiscarded([{}, {}], 2);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Telemetry events are being discarded'),
        2
      );
      warnSpy.mockRestore();
    });

    it('eventsDiscarded warns only once (subsequent calls are silent)', () => {
      const { initialize } = loadModule();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      initialize(testConnString, mockHistory);

      const listener = mockNotificationListeners.current[0];
      listener.eventsDiscarded([{}], 1);
      listener.eventsDiscarded([{}], 2);
      listener.eventsDiscarded([{}], 3);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });
  });

  describe('SDK configuration', () => {
    // Validates P1 #5 fix: maxBatchInterval should be 15000, not 0
    it('maxBatchInterval is set to 15000', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);
      expect(mockCapturedConfig.current.maxBatchInterval).toBe(15000);
    });

    // Validates P1 #12 fix: exclude Amazon from correlation headers (CORS)
    it('correlationHeaderExcludedDomains includes amazon', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);

      expect(
        mockCapturedConfig.current.correlationHeaderExcludedDomains
      ).toBeDefined();
      expect(
        mockCapturedConfig.current.correlationHeaderExcludedDomains
      ).toEqual(expect.arrayContaining([expect.stringMatching(/amazon/i)]));
    });

    // Validates P2 #17 fix: ClickAnalyticsPlugin configured with dataTags
    it('ClickAnalyticsPlugin is configured with dataTags', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);

      const ext = mockCapturedConfig.current.extensionConfig;
      const clickKey = Object.keys(ext).find(
        (k) => k !== 'ReactPlugin' && k !== ext['ReactPlugin']
      );
      const clickConfig = ext[clickKey] || ext['ClickAnalyticsPlugin'];
      expect(clickConfig).toBeDefined();
      expect(clickConfig).toHaveProperty('dataTags');
    });

    // Validates P2 #18 fix: sampling percentage is configured
    it('samplingPercentage is configured (between 0 and 100)', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);

      expect(mockCapturedConfig.current.samplingPercentage).toBeDefined();
      expect(mockCapturedConfig.current.samplingPercentage).toBeGreaterThan(0);
      expect(
        mockCapturedConfig.current.samplingPercentage
      ).toBeLessThanOrEqual(100);
    });

    // Validates P2 #20 fix: telemetry initializer is registered
    it('registers a telemetry initializer', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);

      expect(
        mockAppInsightsInstance.addTelemetryInitializer
      ).toHaveBeenCalled();
    });

    // Validates P2 #16 fix: autoCapture should be false on click plugin
    it('autoCapture is false on ClickAnalyticsPlugin config', () => {
      const { initialize } = loadModule();
      initialize(testConnString, mockHistory);

      const ext = mockCapturedConfig.current.extensionConfig;
      const clickKey = Object.keys(ext).find(
        (k) => k !== 'ReactPlugin' && k !== ext['ReactPlugin']
      );
      const clickConfig = ext[clickKey] || ext['ClickAnalyticsPlugin'];
      expect(clickConfig).toBeDefined();
      expect(clickConfig.autoCapture).toBe(false);
    });
  });
});
