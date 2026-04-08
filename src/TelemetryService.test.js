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
const mockAppInsightsInstance = {
  loadAppInsights: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  trackException: jest.fn(),
  trackMetric: jest.fn(),
  addTelemetryInitializer: jest.fn(),
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

    // CRA resetMocks clears mock implementations - re-apply the factory
    const {
      ApplicationInsights,
    } = require('@microsoft/applicationinsights-web');
    ApplicationInsights.mockImplementation((args) => {
      mockCapturedConfig.current = args.config;
      mockAppInsightsInstance.config = args.config;
      return mockAppInsightsInstance;
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
      const second = initialize('other-conn', mockHistory);

      expect(first).toBe(second);
      expect(ApplicationInsights).toHaveBeenCalledTimes(1);
    });

    it('throws when browserHistory is missing', () => {
      const { initialize } = loadModule();
      expect(() => initialize(testConnString, null)).toThrow(
        'Could not initialize Telemetry Service'
      );
    });

    it('throws when browserHistory is undefined', () => {
      const { initialize } = loadModule();
      expect(() => initialize(testConnString, undefined)).toThrow(
        'Could not initialize Telemetry Service'
      );
    });

    it('throws when connectionString is missing', () => {
      const { initialize } = loadModule();
      expect(() => initialize(null, mockHistory)).toThrow();
      expect(() => initialize('', mockHistory)).toThrow();
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
