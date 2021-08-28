/* eslint-disable no-unused-vars */
import './App.css';
import { useState } from 'react';
import RealTimeBPMAnalyzer from 'realtime-bpm-analyzer';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

function App() {
  let context;
  let input;
  let scriptProcessorNode;
  let audioMotion;

  const audioMotionGradientOptions = {
    bgColor: '#0D4C73',
    dir: 'v',
    colorStops: [
      { pos: 0.8, color: '#35748C' },
      { pos: 0.6, color: '#F2B680' },
      { pos: 0.4, color: '#D98C5F' },
      { pos: 0.2, color: '#8C5230' },
    ],
  };

  const [threshold, setThreshold] = useState(0);
  const [primaryBPM, setPrimaryBPM] = useState(``);
  const [secondaryBPM, setSecondaryBPM] = useState(``);
  const [isListening, setIsListening] = useState(false);

  const [isShowingInit, setIsShowingInit] = useState(true);
  const [isResultReady, setIsResultReady] = useState(false);

  const stopListening = () => {
    /*     input.disconnect(scriptProcessorNode);
    scriptProcessorNode.disconnect(context.destination);
    context.resume().then(() => {
      setIsListening(false);
      setIsShowingInit(true);
    });

    audioMotion.disconnectInput(); */

    setIsListening(false);
    setIsShowingInit(true);
    window.location.reload();
  };

  const onStream = (stream) => {
    input = context.createMediaStreamSource(stream);
    scriptProcessorNode = context.createScriptProcessor(4096, 1, 1);
    input.connect(scriptProcessorNode);
    scriptProcessorNode.connect(context.destination);

    const onAudioProcess = new RealTimeBPMAnalyzer({
      debug: true,
      scriptNode: {
        bufferSize: 4096,
        numberOfInputChannels: 1,
        numberOfOutputChannels: 1,
      },
      computeBPMDelay: 5000,
      stabilizationTime: 10000,
      continuousAnalysis: true,
      pushTime: 1000,
      pushCallback: (err, bpm, threshold) => {
        if (err) {
          console.error(`${err.name}: ${err.message}`);

          setIsResultReady(false);
          return;
        }

        if (bpm && bpm.length) {
          setIsResultReady(true);
          setThreshold(Math.round(threshold * 100) / 100);

          setPrimaryBPM(`${bpm[0].tempo}`);
          setSecondaryBPM(`${bpm[1].tempo}`);

          console.table(bpm);
          console.log(`Threshold, ${threshold}`);
        }
      },
      onBpmStabilized: (threshold) => {
        onAudioProcess.clearValidPeaks(threshold);
      },
    });

    scriptProcessorNode.onaudioprocess = (e) => {
      onAudioProcess.analyze(e);
    };
  };

  const startListening = () => {
    window.AudioContext =
      window.AudioContext ||
      window.mozAudioContext ||
      window.webkitAudioContext;
    context = new window.AudioContext();

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          audioMotion = new AudioMotionAnalyzer(
            document.getElementById('AudioMotionAnalyzer')
          );

          audioMotion.registerGradient('my-grad', audioMotionGradientOptions);

          audioMotion.setOptions({
            gradient: 'my-grad',
            height: window.innerHeight / 4,
            showBgColor: false,
            overlay: true,
            mode: 6,
            lumiBars: false,
            showLeds: true,
            showScaleX: false,
            loRes: true,
          });

          audioMotion.setLedParams({
            maxLeds: 20,
            spaceV: 1,
            spaceH: 2,
          });

          const micStream =
            audioMotion.audioCtx.createMediaStreamSource(stream);
          audioMotion.connectInput(micStream);
          audioMotion.volume = 0;

          onStream(stream);

          setIsListening(true);
          setIsShowingInit(false);
        })
        .catch((err) => {
          console.error(`${err.name}: ${err.message}`);
        });
    } else {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      navigator.getUserMedia({ audio: true }, onStream.bind(this), (err) => {
        console.error(`${err.name}: ${err.message}`);
      });
    }
  };

  return (
    <>
      <header>
        <h1>BPM Techno &mdash; Real-Time BPM Counter</h1>
      </header>
      <div className="HolyGrail-body">
        <main className="HolyGrail-content">
          {isShowingInit ? (
            <div>
              <button
                onClick={startListening}
                disabled={isListening}
                className="btn-start"
              >
                Start listening
              </button>

              <p>You will be asked to provide access to your microphone.</p>
              <p>App does not send any audio stream data to the servers.</p>
            </div>
          ) : (
            <div>
              <h2 style={{ opacity: threshold + 0.4 }}>
                {isResultReady ? primaryBPM : ''}
              </h2>
              <h3>{isResultReady ? 'BPM' : 'Listening...'}</h3>

              {isResultReady ? (
                <h4>
                  <small>or </small>
                  {secondaryBPM}
                  <small> BPM</small>
                </h4>
              ) : (
                ''
              )}

              {!isResultReady && primaryBPM ? (
                <h4>
                  <small>Last: </small>
                  {primaryBPM}
                  <small> BPM</small>
                </h4>
              ) : (
                ''
              )}

              <button onClick={stopListening} className="btn-stop">
                Start over
              </button>
            </div>
          )}
        </main>
        <nav className="HolyGrail-nav"></nav>
        <aside className="HolyGrail-ads"></aside>
      </div>
      <footer>
        <div id="AudioMotionAnalyzer" className="analyzer"></div>
        <p>
          Made in 🇳🇴&nbsp; by{' '}
          <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a> |{' '}
          <a href="https://github.com/webmaxru/bpm-counter">GitHub</a>
        </p>
      </footer>
    </>
  );
}

export default App;
