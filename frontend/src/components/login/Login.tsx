import React from "react";

const backendDomain = process.env.REACT_APP_BACKEND_DOMAIN || "domain";

const Login: React.FC = () => (
  <div style={{ marginTop: 40, textAlign: "center" }}>
    <a href={`http://${backendDomain}/auth/login`}>
      {/* TODO: Replace with <img ... /> when you have a logo */}
      <span style={{ fontSize: 24, fontWeight: 600 }}>Sign in with Steam</span>
    </a>
  </div>
);

export default Login;
