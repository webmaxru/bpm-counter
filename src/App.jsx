/* eslint-disable no-unused-vars */
import './App.css';
import Home from './Home.jsx';
import Upload from './Upload.jsx';
import TapTempo from './TapTempo.jsx';
import BpmToMs from './BpmToMs.jsx';
import BpmConverter from './BpmConverter.jsx';
import PublishingPage, { GuidePage } from './PublishingPage.jsx';
import NotFound from './NotFound.jsx';
import log from 'loglevel';
import { isMobile } from 'react-device-detect';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
} from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAppInsights, reactPlugin } from './TelemetryService';
import TelemetryProvider from './telemetry-provider';
import { TelemetryContext } from './TelemetryContext';
import { AppInsightsErrorBoundary } from '@microsoft/applicationinsights-react-js';
import Seo from './Seo';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';
  const isForcedViz = query.get('viz') === 'true';
  const testBPM = query.get('bpm');

  log.setDefaultLevel(isDebug ? 'info' : 'error');

  const [appInsights, setAppInsights] = useState(null);
  const navLinkClassName = ({ isActive }) =>
    isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link';

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


    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Router>
      <TelemetryProvider
        connectionString={import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING}
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
          </header>
          <div className="body">
            <nav className="site-nav" aria-label="Primary">
              <NavLink className={navLinkClassName} end to="/">
                Listen
              </NavLink>
              <NavLink className={navLinkClassName} to="/upload">
                Audio URL
              </NavLink>
              <NavLink className={navLinkClassName} to="/tools/tap-tempo">
                Tap tempo
              </NavLink>
              <NavLink className={navLinkClassName} to="/tools/bpm-to-ms">
                BPM to ms
              </NavLink>
              <NavLink
                className={navLinkClassName}
                to="/guides/beatmatching"
              >
                Beatmatching
              </NavLink>
            </nav>

            <AppInsightsErrorBoundary
              onError={() => <h1>Something went wrong</h1>}
              appInsights={reactPlugin}
            >
              <Routes>
                <Route
                  path="/about"
                  element={<PublishingPage pageId="about" />}
                />
                <Route
                  path="/affiliate-disclosure"
                  element={<PublishingPage pageId="affiliate-disclosure" />}
                />
                <Route
                  path="/privacy"
                  element={<PublishingPage pageId="privacy" />}
                />
                <Route
                  path="/privacy.html"
                  element={<Navigate replace to="/privacy" />}
                />
                <Route
                  path="/terms"
                  element={<PublishingPage pageId="terms" />}
                />
                <Route
                  path="/contact"
                  element={<PublishingPage pageId="contact" />}
                />
                <Route path="/upload" element={<Upload isDebug={isDebug} log={log} />} />
                <Route path="/tools/tap-tempo" element={<TapTempo />} />
                <Route path="/tools/bpm-to-ms" element={<BpmToMs />} />
                <Route path="/tools/bpm-converter" element={<BpmConverter />} />
                <Route path="/guides/:slug" element={<GuidePage />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppInsightsErrorBoundary>

            <aside className="related-nav" aria-label="Popular BPM resources">
              <h2>Popular resources</h2>
              <Link to="/tools/bpm-converter">Half/double BPM</Link>
              <Link to="/guides/genre-bpm-ranges">Genre BPM ranges</Link>
              <Link to="/guides/how-bpm-detection-works">
                How detection works
              </Link>
            </aside>
          </div>
          <footer>
            <div id="AudioMotionAnalyzer"></div>

            {!isDebug ? (
              <p>
                Made in 🇳🇴&nbsp; by&nbsp;
                <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a> |&nbsp;
                <Link to="/about">About</Link> |&nbsp;
                <Link to="/privacy">Privacy</Link> |&nbsp;
                <Link to="/terms">Terms</Link> |&nbsp;
                <Link to="/contact">Contact</Link> |&nbsp;
                <Link to="/affiliate-disclosure">Affiliate disclosure</Link>
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
