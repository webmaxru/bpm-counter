import React, { useEffect, useState } from 'react';

function Account() {
  const [clientPrincipal, setClientPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
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

      setIsLoading(false);
    };

    run();
  }, []);

  return (
    <main className="content">
      <h3>Account</h3>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {clientPrincipal ? (
            <>
              <pre>/.auth/me</pre>
              <ul>
                <li>identityProvider: {clientPrincipal.identityProvider}</li>
                <li>userId: {clientPrincipal.userId}</li>
                <li>userDetails: {clientPrincipal.userDetails}</li>
                <li>userRoles: {clientPrincipal.userRoles.join(', ')}</li>
              </ul>

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
            </>
          ) : (
            <p>Not logged in. <a href="/login">Log in</a> here.</p>
          )}
        </>
      )}
    </main>
  );
}

export default Account;
