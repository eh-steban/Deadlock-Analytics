import React from "react";
import steamLoginImg from "../../assets/steam-button-vertical.png";

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

const Login: React.FC = () => (
  <div className='m-auto mt-10 flex w-full max-w-md flex-col items-center justify-center gap-15 rounded-md border-2 border-stone-500 p-6 shadow-lg inset-shadow-sm/10 shadow-lime-600/50 md:mt-auto lg:h-60 lg:w-1/3 lg:flex-row'>
    <div className='text-center'>
      <h3 className='underline decoration-purple-500 decoration-3'>
        dashJump.gg
      </h3>
      <p className='m-0'>Welcome!</p>
    </div>
    <a
      href={`http://${backendDomain}/auth/login`}
      className='inline-flex items-center justify-center'
    >
      <img
        src={steamLoginImg}
        alt='Steam logo'
        className='h-10 w-auto sm:h-12 lg:h-14'
      />
    </a>
  </div>
);

export default Login;
