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
      <p>
        Questions? Contact{' '}
        <a href="https://twitter.com/webmaxru">Maxim Salnikov</a>
      </p>

      <h3>Demo</h3>

      <ol>
        <li>
          <a href="https://github.com/webmaxru/bpm-counter/">GitHub Repo</a>
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
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/front-end-frameworks">
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
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/review-publish-pull-requests">
            Quickstarts
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
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/add-api">
            Quickstarts
          </a>
        </li>
        <li>
          <b>Authentication</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/authentication-authorization">
            Quickstarts
          </a>
          <p>Use /.auth/ helpers</p>
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
            Log in with redirect to account
          </a>
          <br />
          <br />
          <pre>/.auth/logout</pre>
          <a href=".auth/logout">Log out</a>
          <br />
          <br />
          <pre>/.auth/me</pre>
          <button className="button" onClick={fetchClientPrincipal}>
            Fetch data
          </button>
          {clientPrincipal ? (
            <>
              <br />
              <br />
              <ul>
                <li>identityProvider: {clientPrincipal.identityProvider}</li>
                <li>userId: {clientPrincipal.userId}</li>
                <li>userDetails: {clientPrincipal.userDetails}</li>
                <li>userRoles: {clientPrincipal.userRoles.join(', ')}</li>
              </ul>
            </>
          ) : null}
          <br />
          <br />
        </li>
        <li>
          <b>Routes</b> |{' '}
          <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/routes">
            Quickstarts
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
          <a href="https://aka.ms/swadocs">
            <strong>Documentation | aka.ms/swadocs</strong>
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
            Quickstarts - Angular
          </a>
        </li>
        <li>
          <a href="https://dev.to/azure/six-minutes-to-learn-azure-static-web-apps-ehn">
            SWA in 6 minutes
          </a>
        </li>
      </ul>
    </main>
  );
}

export default About;
