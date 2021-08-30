/* eslint-disable no-unused-vars */
import './App.css';
import Home from './Home.js';
import log from 'loglevel';
import { BrowserView, isMobile } from 'react-device-detect';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';
  log.setDefaultLevel(isDebug ? 'info' : 'error');

  return (
    <>
      <header>
        <h1>BPM Techno &mdash; Real-Time BPM Counter</h1>
      </header>
      <div className="body">
        <Home isDebug={isDebug} log={log} isMobile={isMobile}></Home>
        <nav className="nav"></nav>
        <aside className="ads"></aside>
      </div>
      <footer>
        <BrowserView>
          <div id="AudioMotionAnalyzer" className="analyzer"></div>
        </BrowserView>

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
