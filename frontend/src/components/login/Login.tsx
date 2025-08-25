import React from "react";
import steamLoginImg from '../../assets/steam-button-vertical.png';

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

const Login: React.FC = () => (
  <div className="mt-10 flex flex-col items-center gap-4">
    <a
      href={`http://${backendDomain}/auth/login`}
      className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
    >
      <img src={steamLoginImg} alt="Steam logo" className="h-10 w-auto" />
    </a>
  </div>
);

export default Login;
