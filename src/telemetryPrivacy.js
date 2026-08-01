export const APP_INSIGHTS_BYPASS_FETCH =
  'Microsoft_ApplicationInsights_BypassAjaxInstrumentation';

export function getTelemetryPath(location) {
  return location.pathname || '/';
}

export function getTelemetryUrl(location, origin) {
  return new URL(getTelemetryPath(location), origin).toString();
}
