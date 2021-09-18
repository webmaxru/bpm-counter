import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Feedback(props) {
  const bpm = props.bpm;
  const log = props.log;

  const url = `/api/feedback`;
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  async function sendFeedback(isCorrect) {
    requestOptions.body = JSON.stringify({
      bpm: bpm,
      isCorrect: isCorrect,
    });

    try {
      let response = await fetch(url, requestOptions);

      if (!response.ok) {
        log.error(`HTTP error. Status: ${response.status}`);
        throw new Error();
      }

      toast('Counted! Thanks!');
    } catch (err) {
      log.error(`${err.name}: ${err.message}`);
    }
  }

  return (
    <div>
      <br />
      <p>Does {bpm} sound correct?</p>
      <button onClick={() => sendFeedback(true)}>👍🏽</button>
      &nbsp;&nbsp;&nbsp;
      <button onClick={() => sendFeedback(false)}>👎🏽</button>
      <ToastContainer />
    </div>
  );
}

export default Feedback;
