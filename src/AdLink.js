import React from 'react';
import ReactGA from 'react-ga4';

function AdLink(props) {
  const appInsights = props.appInsights;

  console.log(appInsights);
  let ad = props.ad;

  const getRandomInt = (max) => {
    return Math.floor(Math.random() * max) + 1;
  };

  let ads = {
    'search-dj-controllers': {
      link: 'https://www.amazon.com/gp/search?ie=UTF8&tag=webapplication-20&linkCode=ur2&linkId=8ca01d484b759858f609454d6dbc68b7&camp=1789&creative=9325&index=mi&keywords=dj%20controllers',
      texts: [
        '🎧🎛 Get 💰Savings on 🔥Hot DJ Controllers!',
        '🤑DJ Controllers on 🔥Sale Now! 🤩',
        '🤑🤩Score 💰Savings on 🎧DJ Controllers!',
        '🤑🤩Grab 💰Savings on 🎧DJ Controllers!',
        '🤑🤩💰Save Now on 🎧DJ Controllers!',
        '🤑🤩💰Affordable 🎧DJ Controllers!',
        '🤑🤩💰Grab 🎧DJ Controllers at 💰Savings!',
        '🤑🤩💰Get 🎧DJ Controllers at 💰Savings!',
        '🤑🤩💰Affordable 🎧DJ Controllers Here!',
        '🤑🤩💰Get 🎧DJ Controllers at 💰Savings Now!',
      ],
    },
    'item-sample-pack': {
      link: 'https://www.amazon.com/Samples-Maschine-Ableton-Instruments-Production/dp/B09C2M5D82/ref=sr_1_1?crid=6TO3QGDAE9Z0&keywords=ableton+sound+pack&qid=1688655275&rnid=2941120011&s=musical-instruments&sprefix=ableton+sound+pack%252Caps%252C172&sr=1-1&_encoding=UTF8&tag=webapplication-20&linkCode=ur2&linkId=5a48eda719a3ed9bc124e62c1dce4080&camp=1789&creative=9325',
      texts: [
        '🎧🤩100Gb Sound Pack: 100K+ Samples for Ableton, MPK, Logic🔥',
        '🎧🤩100Gb Sound Pack: 100K+ Samples | 808s, Synths, Loops, FX🔥',
        '🎧🤩EDM Production USB: 100K+ Samples for Ableton, MPK, Logic🔥',
      ],
    },
    'item-music-prod': {
      link: 'https://www.amazon.com/Music-Production-Beginners-2022-Songwriters-ebook/dp/B09SZJD7XN/ref=sr_1_7?keywords=edm+dj+music+production&qid=1688664662&rnid=2941120011&s=books&sr=1-7&_encoding=UTF8&tag=webapplication-20&linkCode=ur2&linkId=4f3bc88283a657ecc139adc47e46c2bf&camp=1789&creative=9325',
      texts: [
        '🎧📖Music Production For Beginners 2022+ Edition🔥',
        '🎧📖How to Produce Music: The Easy to Read Guide for Beginners🔥',
      ],
    },
  };

  let adText = ads[ad].texts[getRandomInt(ads[ad].texts.length) - 1];

  const handleClick = (event) => {
    ReactGA.event('click_ad', {
      ad: ad,
      text: adText,
    });
    appInsights.trackEvent({
      name: 'click_ad',
      properties: {
        ad: ad,
        text: adText,
      },
    });
  };

  return (
    <a
      href={ads[ad].link}
      onClick={handleClick}
      target="_blank"
      rel="noreferrer"
    >
      {adText}
    </a>
  );
}

export default AdLink;
