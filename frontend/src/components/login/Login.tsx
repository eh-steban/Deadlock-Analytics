import React from "react";

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

const Login: React.FC = () => (
  <div className="mt-10 flex flex-col items-center gap-4">
    <a
      href={`http://${backendDomain}/auth/login`}
      className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
    >
      {/* TODO: Replace with <img ... /> when you have a logo */}
      <span className="text-lg font-semibold">Sign in with Steam</span>
    </a>
  </div>
);

export default Login;
