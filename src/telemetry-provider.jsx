import React, { Component, Fragment } from 'react';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { ai } from './TelemetryService';
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
    const { history } = this.props;
    const { initialized } = this.state;
    const AppInsightsConnectionString= this.props.connectionString; // PUT YOUR KEY HERE
    if (
      !Boolean(initialized) &&
      Boolean(AppInsightsConnectionString) &&
      Boolean(history)
    ) {
      ai.initialize(AppInsightsConnectionString, history);
      this.setState({ initialized: true });
    }

    this.props.after();
  }

  render() {
    const { children } = this.props;
    return <Fragment>{children}</Fragment>;
  }
}

export default withRouter(withAITracking(ai.reactPlugin, TelemetryProvider));
