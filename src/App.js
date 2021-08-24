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
  const [primaryBPM, setPrimaryBPM] = useState(`Listening...`);
  const [secondaryBPM, setSecondaryBPM] = useState(``);
  const [isListening, setIsListening] = useState(false);

  const [isShowingInit, setIsShowingInit] = useState(true);
  const [isShowingResults, setIsShowingResults] = useState(false);

  const stopListening = () => {
    input.disconnect(scriptProcessorNode);
    scriptProcessorNode.disconnect(context.destination);
    context.resume().then(() => {
      setIsListening(false);
      setIsShowingResults(false);
      setIsShowingInit(true);
    });

    audioMotion.disconnectInput();
  };

  const startListening = () => {
    window.AudioContext =
      window.AudioContext ||
      window.mozAudioContext ||
      window.webkitAudioContext;
    context = new window.AudioContext();

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
        pushCallback: function (err, bpm, threshold) {
          if (err) throw err;

          if (bpm && bpm.length) {
            setThreshold(Math.round(threshold * 100) / 100);
            setPrimaryBPM(`${bpm[0].tempo}`);
            setSecondaryBPM(`${bpm[1].tempo}`);

            console.log(
              `BPM: #1 ${bpm[0].tempo} - ${bpm[0].count}, #2 ${bpm[1].tempo} - ${bpm[1].count}, ${threshold}`
            );
          }
        },
        onBpmStabilized: (threshold) => {
          onAudioProcess.clearValidPeaks(threshold);
        },
      });

      scriptProcessorNode.onaudioprocess = function (e) {
        onAudioProcess.analyze(e);
      };
    };

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
            height: window.innerHeight / 3,
            showBgColor: true,
            overlay: false,
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
          // connect microphone stream to analyzer
          audioMotion.connectInput(micStream);
          // mute output to prevent feedback loops from the speakers
          audioMotion.volume = 0;

          onStream(stream);

          setIsListening(true);
          setIsShowingResults(true);
          setIsShowingInit(false);
        })
        .catch((e) => {
          console.log(e.name + ': ' + e.message);
        });
    } else {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      navigator.getUserMedia(
        { audio: true },
        onStream.bind(this),
        function () {}
      );
    }
  };

  return (
    <>
      <header></header>
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
            </div>
          ) : null}
          {isShowingResults ? (
            <div>
              <h1>{primaryBPM}</h1>
              <h2>{secondaryBPM}</h2>
            </div>
          ) : null}
        </main>
        <nav className="HolyGrail-nav"></nav>
        <aside className="HolyGrail-ads" onClick={stopListening}>{threshold}</aside>
      </div>
      <footer>
        <div id="AudioMotionAnalyzer" className="analyzer"></div>
      </footer>
    </>
  );
}

export default App;
