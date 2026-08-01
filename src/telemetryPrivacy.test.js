import {
  APP_INSIGHTS_BYPASS_FETCH,
  getTelemetryPath,
  getTelemetryUrl,
} from './telemetryPrivacy';

describe('telemetry privacy helpers', () => {
  it('excludes query strings and fragments from telemetry locations', () => {
    const location = {
      pathname: '/upload',
      search: '?url=https%3A%2F%2Fexample.com%2Faudio.mp3%3Ftoken%3Dsecret',
      hash: '#result',
    };

    expect(getTelemetryPath(location)).toBe('/upload');
    expect(getTelemetryUrl(location, 'https://bpmtech.no')).toBe(
      'https://bpmtech.no/upload'
    );
  });

  it('uses the Application Insights fetch bypass property', () => {
    expect(APP_INSIGHTS_BYPASS_FETCH).toBe(
      'Microsoft_ApplicationInsights_BypassAjaxInstrumentation'
    );
  });
});
