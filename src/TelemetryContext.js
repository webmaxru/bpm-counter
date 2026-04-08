import { createContext } from 'react';

// P2 #19: Provides appInsights to all components via Context instead of prop drilling
export const TelemetryContext = createContext(null);
