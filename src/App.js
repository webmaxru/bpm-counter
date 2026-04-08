/* eslint-disable no-unused-vars */
import './App.css';
import Home from './Home.js';
import About from './About.js';
import Account from './Account.js';
import Admin from './Admin.js';
import Login from './Login.js';
import Upload from './Upload.js';
import log from 'loglevel';
import { isMobile } from 'react-device-detect';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAppInsights, reactPlugin } from './TelemetryService';
import TelemetryProvider from './telemetry-provider';
import { TelemetryContext } from './TelemetryContext';
import { AppInsightsErrorBoundary } from '@microsoft/applicationinsights-react-js';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';
  const isForcedViz = query.get('viz') === 'true';
  const testBPM = query.get('bpm');

  log.setDefaultLevel(isDebug ? 'info' : 'error');

  const [appInsights, setAppInsights] = useState(null);

  useEffect(() => {
    let mounted = true;

    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');

      const refreshPage = () => {
        wb.addEventListener('controlling', (event) => {
          window.location.reload();
        });

        wb.messageSkipWaiting();
      };

      const Msg = () => (
        <div>
          Updated app is available&nbsp;&nbsp;
          <button onClick={refreshPage}>Reload</button>
        </div>
      );

      const showSkipWaitingPrompt = (event) => {
        toast.info(<Msg />);
      };

      wb.addEventListener('waiting', showSkipWaitingPrompt);

      wb.addEventListener('message', (event) => {
        if (!event.data) {
          return;
        }
        // P1 #11: Track SW offline events to App Insights
        if (event.data.type === 'REPLAY_COMPLETED') {
          toast.success(
            'Your feedback was sent after the connection is restored'
          );
          getAppInsights()?.trackEvent({
            name: 'sw_replay_completed',
            properties: { type: 'REPLAY_COMPLETED' },
          });
        }
        if (event.data.type === 'REQUEST_FAILED') {
          toast.warning(
            'Your feedback will be sent after the connection is restored'
          );
          getAppInsights()?.trackEvent({
            name: 'sw_request_failed',
            properties: { type: 'REQUEST_FAILED' },
          });
        }
      });

      if (mounted) {
        wb.register()
          .then((registration) => {})
          .catch((err) => {
            console.error(err);
          });
      }
    }


    const [navTiming] = window.performance.getEntriesByType("navigation");
    console.log(navTiming)
    
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Router>
      <TelemetryProvider
        connectionString={process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING}
        after={() => {
          // P0 #2: Removed manual trackPageView() — React plugin auto-tracks via history
          setAppInsights(getAppInsights());
        }}
      >
        <TelemetryContext.Provider value={appInsights}>
          <header>
            <h1>
              <Link to="/">BPM Techno &mdash; Real-Time BPM Counter</Link>
            </h1>
            <Link to="/about" className="about">
              &#63;
            </Link>
          </header>
          <div className="body">
            <AppInsightsErrorBoundary
              onError={() => <h1>Something went wrong</h1>}
              appInsights={reactPlugin}
            >
              <Routes>
                <Route path="/about" element={<About />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<Login />} />
                <Route path="/upload" element={<Upload isDebug={isDebug} log={log} />} />
                <Route
                  path="/"
                  element={
                    <Home
                      isDebug={isDebug}
                      log={log}
                      isMobile={isMobile}
                      isForcedViz={isForcedViz}
                      testBPM={testBPM}
                    />
                  }
                />
              </Routes>
            </AppInsightsErrorBoundary>

            <nav className="nav"></nav>
            <aside className="ads"></aside>
          </div>
          <footer>
            <div id="AudioMotionAnalyzer"></div>

            {!isDebug ? (
              <p>
                Made in 🇳🇴&nbsp; by&nbsp;
                <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a> |&nbsp;
                <a href="https://github.com/webmaxru/bpm-counter">GitHub</a>
              </p>
            ) : (
              <p>Debugging mode</p>
            )}
          </footer>

          <ToastContainer />
        </TelemetryContext.Provider>
      </TelemetryProvider>
    </Router>
  );
}

export default App;
