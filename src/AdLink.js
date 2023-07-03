import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

function AdLink(props) {
  let log = props.log;
  const appInsights = props.appInsights;

  console.log(appInsights)
  let ad = props.ad;

  const getRandomInt = (max) => {
    return Math.floor(Math.random() * max) + 1;
  };

  let ads = {
    'search-dj-controllers': {
      link: 'https://www.amazon.com/gp/search?ie=UTF8&tag=maxious-20&linkCode=ur2&linkId=8ca01d484b759858f609454d6dbc68b7&camp=1789&creative=9325&index=mi&keywords=dj%20controllers',
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
  };

  let adText = ads[ad].texts[getRandomInt(ads[ad].texts.length) - 1];

  useEffect(() => {
    // adText = ads[ad].texts[getRandomInt(ads[ad].texts.length)-1];
  }, []);

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
