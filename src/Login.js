function Login() {
  return (
    <main className="content">
      <h3>Log in</h3>

      <pre>/.auth/login/twitter</pre>
      <a href=".auth/login/twitter" class="button">
        Log in with Twitter
      </a>
      <br />
      <br />
      <pre>/.auth/login/github</pre>
      <a href=".auth/login/github" class="button">
        Log in with GitHub
      </a>
      <br />
      <br />
      <pre>/.auth/login/aad</pre>
      <a href=".auth/login/aad" class="button">
        Log in with Azure Active Directory
      </a><br />
      (disabled for the demo purposes)
      <br />
      <br />
      <pre>/.auth/login/twitter?post_login_redirect_uri=/account</pre>
      <a href="/.auth/login/twitter?post_login_redirect_uri=/account">
        Log in with Twitter with redirect to /account
      </a>

      <pre>/.auth/login/github?post_login_redirect_uri=/account</pre>
      <a href="/.auth/login/github?post_login_redirect_uri=/account">
        Log in with GitHub with redirect to /admin
      </a>
    </main>
  );
}

export default Login;
