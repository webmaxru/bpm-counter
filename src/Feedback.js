import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactHintFactory from 'react-hint';
import 'react-hint/css/index.css';
import './custom-hint.css';
import ReactGA from 'react-ga4';
import { TelemetryContext } from './TelemetryContext';

const ReactHint = ReactHintFactory(React);

class Feedback extends React.Component {
  // P2 #19: Use Context instead of prop drilling
  static contextType = TelemetryContext;

  constructor(props) {
    super(props);

    this.sendFeedback = this.sendFeedback.bind(this);

    this.url = `/api/feedback`;
    this.requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
  }

  componentDidMount() {
    this.instance.toggleHint({ target: this.button });
    setTimeout(() => {
      if (this.instance) this.instance.toggleHint({ target: null });
    }, 5000);
  }

  async sendFeedback(isCorrect) {
    this.requestOptions.body = JSON.stringify({
      bpm: this.props.bpm,
      type: this.props.type,
      isCorrect: isCorrect,
    });

    try {
      // Let's assume that the request is successful
      toast.success('Sending your feedback. Thanks!');

      let response = await fetch(this.url, this.requestOptions);

      ReactGA.event('share', {
        method: 'API',
        content_type: 'feedback',
        item_id: isCorrect,
      });
      this.context?.trackEvent({
        name: 'share',
        properties: {
          method: 'API',
          content_type: 'feedback',
          item_id: isCorrect,
        },
      });

      if (!response.ok) {
        this.props.log.error(`HTTP error. Status: ${response.status}`);
        throw new Error(`HTTP error. Status: ${response.status}`);
      }
    } catch (err) {
      toast.error('Oops, no luck with sending this time');
      this.props.log.error(`${err.name}: ${err.message}`);
      // P1 #7: Track API errors to App Insights
      this.context?.trackException({ exception: err });
    }
  }

  render() {
    return (
      <div>
        <br />
        <p>Does {this.props.bpm} sound correct?</p>
        <button
          onClick={() => this.sendFeedback(true)}
          data-rh="Please, give us feedback - did it count BPM correctly?"
          ref={(ref) => (this.button = ref)}
        >
          👍🏽
        </button>
        &nbsp;&nbsp;&nbsp;
        <button onClick={() => this.sendFeedback(false)}>👎🏽</button>
        <ReactHint
          events="false"
          ref={(ref) => (this.instance = ref)}
          delay="2000"
          position="bottom"
          className="custom-hint react-hint"
        />
      </div>
    );
  }
}

export default Feedback;
