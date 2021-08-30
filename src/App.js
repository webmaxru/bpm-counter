/* eslint-disable no-unused-vars */
import './App.css';
import Home from './Home.js';
import log from 'loglevel';
import { isMobile } from 'react-device-detect';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';
  const isForcedViz = query.get('viz') === 'true';
  log.setDefaultLevel(isDebug ? 'info' : 'error');

  return (
    <>
      <header>
        <h1>BPM Techno &mdash; Real-Time BPM Counter</h1>
      </header>
      <div className="body">
        <Home
          isDebug={isDebug}
          log={log}
          isMobile={isMobile}
          isForcedViz={isForcedViz}
        ></Home>
        <nav className="nav"></nav>
        <aside className="ads"></aside>
      </div>
      <footer>
        <div id="AudioMotionAnalyzer" className="analyzer"></div>

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
    </>
  );
}

export default App;
