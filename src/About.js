import React, { useState } from 'react';

function About() {
  const [clientPrincipal, setClientPrincipal] = useState(null);

  async function fetchClientPrincipal() {
    try {
      const res = await fetch('/.auth/me');
      const json = await res.json();
      if (json.clientPrincipal) {
        setClientPrincipal(json.clientPrincipal);
      }
    } catch (e) {
      if (window.location.hostname === 'localhost') {
        console.warn(
          "Can't access the auth endpoint. For local development, please use the Static Web Apps CLI to emulate authentication: https://github.com/azure/static-web-apps-cli"
        );
      } else {
        console.error(`Failed to unpack JSON.`, e);
      }
    }
  }

  return (
    <main className="content">
      This is a 3-in-1 project:
      <ol>
        <li>
          A real product for DJs to help with identifying BPM (beats per minute)
          of the track currently playing.
        </li>
        <li>
          A real-world demo and a playground for [Azure Static Web
          Apps](https://azure.microsoft.com/en-us/services/app-service/static/?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0)
          (SWA) service.
        </li>
        <li>
          Proof of concept for a Progressive Web App (PWA) driven by
          Workbox-powered service worker.
        </li>
      </ol>
      <h3>Demo</h3>
      <ol>
        <li>
          <a href="https://github.com/webmaxru/bpm-counter/">
            GitHub repo with a step-by-step demo guide
          </a>
        </li>
        <li>
          <b>Build and deploy</b>

          <ul>
            <li>
              <a href="https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites">
                SWA in Azure portal
              </a>
            </li>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/front-end-frameworks/?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0">
                Sample configuration for the frontend frameworks
              </a>
            </li>
            <li>
              <a href="https://github.com/webmaxru/bpm-counter/tree/master/.github/workflows">
                GitHub Actions
              </a>
            </li>
          </ul>
        </li>
        <li>
          <b>Pre-production environments</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/review-publish-pull-requests?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0">
            Documentation
          </a>
          <ul>
            <li>
              <a href="https://github.com/webmaxru/bpm-counter/pulls">
                Pull requests
              </a>
            </li>
          </ul>
        </li>
        <li>
          <b>Creating API</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/add-api?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0">
            Documentation
          </a>
        </li>
        <li>
          <b>Authentication</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/authentication-authorization?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0">
            Documentation
          </a>
          <pre>/login</pre>
          <a href="/login">Common login page</a>
          <br />
          <br />
          <p>Use /.auth/ helpers directly</p>
          <pre>/.auth/login/twitter</pre>
          <a href=".auth/login/twitter">Log in with Twitter</a>
          <br />
          <br />
          <pre>/.auth/login/github</pre>
          <a href=".auth/login/github">Log in with GitHub</a>
          <br />
          <br />
          <pre>/.auth/login/github?post_login_redirect_uri=/account</pre>
          <a href="/.auth/login/github?post_login_redirect_uri=/account">
            Log in with GitHub with redirect to /account
          </a>
          <br />
          <br />
          <pre>/.auth/me</pre>
          <button className="button" onClick={fetchClientPrincipal}>
            Fetch user account data
          </button>
          <br />
          <br />
          {clientPrincipal ? (
            <ul>
              <li>identityProvider: {clientPrincipal.identityProvider}</li>
              <li>userId: {clientPrincipal.userId}</li>
              <li>userDetails: {clientPrincipal.userDetails}</li>
              <li>userRoles: {clientPrincipal.userRoles.join(', ')}</li>
            </ul>
          ) : (
            <p>Not logged in</p>
          )}
          <br />
          <br />
          <pre>/.auth/logout</pre>
          <a href=".auth/logout">Log out</a>
          <br />
          <br />
          <pre>/.auth/purge/twitter</pre>
          <a href=".auth/purge/twitter">
            Remove personal information for Twitter as a provider
          </a>
          <br />
          <br />
          <pre>/.auth/purge/github</pre>
          <a href=".auth/purge/github">
            Remove personal information for GitHub as a provider
          </a>
          <br />
          <br />
        </li>
        <li>
          <b>Routes</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/routes?ocid=aid3040965_ThankYou_DevComm&eventId=SWA_43q5ZzJFbkY0">
            Documentation
          </a>
          <p>
            Use staticwebapp.config.json (
            <a href="https://github.com/webmaxru/bpm-counter/blob/main/src/staticwebapp.config.json">
              sample
            </a>
            ) in the app route
          </p>
          <pre>/login</pre>
          <a href="/login">Log in</a>
          <br />
          <br />
          <pre>/logout</pre>
          <a href="/logout">Log out</a>
          <br />
          <br />
          <pre>/account</pre>
          <a href="/account">Account - for "authenticated" only</a>
          <br />
          <br />
          <pre>/admin</pre>
          <a href="/admin">Admin - for "administrator" only</a>
          <br />
          <br />
          <pre>/aboutme</pre>
          <a href="/aboutme">Redirect 301</a>
          <br />
          <br />
        </li>
      </ol>
      <h3>Useful links</h3>
      <p>Here are some links to help you get started:</p>
      <ul>
        <li>
          <a href="https://aka.ms/swa-docs">
            <strong>Detailed documentation and how-to guides</strong>
          </a>
        </li>
        <li>
          <a href="https://aka.ms/swa-learning">
            <strong>
              Step-by-step learning paths on deploying and configuring your apps
              in Azure Static Web Apps
            </strong>
          </a>
        </li>
        <li>
          <a href="https://burkeholland.github.io/posts/static-app-root-domain/">
            Setting up a root domain (using CloudFlare)
          </a>
        </li>
        <li>
          <a href="https://azure.microsoft.com/en-us/services/app-service/static/">
            Static Web Apps on Azure - landing page
          </a>
        </li>
        <li>
          <a href="https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps">
            VS Code Extension
          </a>
        </li>
        <li>
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/getting-started?tabs=angular">
            Documentation - Angular
          </a>
        </li>
        <li>
          <a href="https://dev.to/azure/six-minutes-to-learn-azure-static-web-apps-ehn">
            SWA in 6 minutes
          </a>
        </li>
        <li>
          <a href="https://www.youtube.com/watch?v=AMhhuBixb4o&ab_channel=MicrosoftAzuren">
            Azure Friday with SWA video
          </a>
        </li>
      </ul>
      <p>
        Questions? Contact{' '}
        <a href="https://twitter.com/webmaxru">Maxim Salnikov</a>
      </p>
    </main>
  );
}

export default About;
