/* eslint-disable no-unused-vars */
import './App.css';
import Home from './Home.js';
import About from './About.js';
import Account from './Account.js';
import log from 'loglevel';
import { isMobile } from 'react-device-detect';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Workbox } from 'workbox-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';
  const isForcedViz = query.get('viz') === 'true';
  log.setDefaultLevel(isDebug ? 'info' : 'error');

  useEffect(() => {
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
          A new version is available&nbsp;&nbsp;
          <button onClick={refreshPage}>Refresh</button>
        </div>
      );

      const showSkipWaitingPrompt = (event) => {
        toast(<Msg />);
      };

      wb.addEventListener('waiting', showSkipWaitingPrompt);

      wb.register();
    }
  }, []);

  return (
    <Router>
      <header>
        <h1>
          <Link to="/">BPM Techno &mdash; Real-Time BPM Counter</Link>
        </h1>
        <Link to="/about" className="about">
          &#63;
        </Link>
      </header>
      <div className="body">
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/account">
            <Account />
          </Route>
          <Route path="/">
            <Home
              isDebug={isDebug}
              log={log}
              isMobile={isMobile}
              isForcedViz={isForcedViz}
            ></Home>
          </Route>
        </Switch>

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
    </Router>
  );
}

export default App;
