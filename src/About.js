function About() {
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
          <b>Pre-production environments</b>

          <ul>
            <li>
              <a href="https://github.com/webmaxru/bpm-counter/pulls">
                Pull requests
              </a>
            </li>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/review-publish-pull-requests">
                Quickstarts
              </a>
            </li>
          </ul>
        </li>
        <li>
          <b>Creating API</b>

          <ul>
            <li>
              <a href="/api/Greet?name=NDC">Test</a>
            </li>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/add-api">
                Quickstarts
              </a>
            </li>
          </ul>
        </li>
        <li>
          <b>Authentication</b>

          <p>Use /.auth/ helpers</p>

          <ul>
            <li>
              <a href=".auth/login/github">Log in with GitHub</a>
            </li>
            <li>
              <a href=".auth/login/twitter">Log in with Twitter</a>
            </li>
            <li>
              <a href=".auth/login/github?post_login_redirect_uri=/profile">
                Log in with a redirect to /profile
              </a>
            </li>
            <li>
              <a href=".auth/me">Check status</a>
            </li>
            <li>
              <a href=".auth/logout">Log out</a>
            </li>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/authentication-authorization">
                Quickstarts
              </a>
            </li>
          </ul>
        </li>
        <li>
          <b>Routes</b>

          <p>Use routes.json in the app route</p>

          <ul>
            <li>
              <a href="https://github.com/webmaxru/bpm-counter/blob/master/src/assets/routes.json">
                Sample file
              </a>
            </li>
            <li>
              <a href="/login">Test /login</a>
            </li>
            <li>
              <a href="/admin">Test /admin</a>
            </li>
            <li>
              <a href="/profile">Test /profile</a>
            </li>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/static-web-apps/routes">
                Quickstarts
              </a>
            </li>
          </ul>
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
