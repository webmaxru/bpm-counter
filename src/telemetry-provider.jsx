import React, { Component, Fragment } from 'react';
import { initialize, getAppInsights } from './TelemetryService';
import { withRouter } from 'react-router-dom';

/**
 * This Component provides telemetry with Azure App Insights
 *
 * NOTE: the package '@microsoft/applicationinsights-react-js' has a HOC withAITracking that requires this to be a Class Component rather than a Functional Component
 */
class TelemetryProvider extends Component {
  state = {
    initialized: false,
  };

  componentDidMount() {
    const { history, connectionString, after } = this.props;
    const { initialized } = this.state;

    if (!initialized && connectionString && history) {
      initialize(connectionString, history);
      this.setState({ initialized: true });
    }

    // P0 #4: Only call after() if initialization succeeded
    const appInsightsInstance = getAppInsights();
    if (after && appInsightsInstance) {
      after();
    }
  }

  render() {
    const { children } = this.props;
    return <Fragment>{children}</Fragment>;
  }
}

// P1 #9: Removed withAITracking — engagement tracking moves to page components
export default withRouter(TelemetryProvider);
