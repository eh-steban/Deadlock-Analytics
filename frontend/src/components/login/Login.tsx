import React from "react";
import steamLoginImg from "../../assets/steam-button-vertical.png";

const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";

const Login: React.FC = () => (
  <div className='flex h-screen w-full items-center justify-center lg:flex-row'>
    <div className='max-w-md rounded-md border-2 border-stone-500 p-6 shadow-lg inset-shadow-sm/10 shadow-lime-600/50 lg:h-60 lg:w-1/3'>
      <div className='flex h-full items-center justify-center gap-15 lg:flex-row lg:text-left'>
        <div>
          <h3 className='underline decoration-purple-500 decoration-3'>
            dashJump.gg
          </h3>
          <p className='m-0 text-center'>Welcome!</p>
        </div>
        <a
          href={`http://${backendDomain}/auth/login`}
          className='mt-4 lg:mt-0'
        >
          <img
            src={steamLoginImg}
            alt='Steam logo'
            className='h-10 w-auto sm:h-12 lg:h-14'
          />
        </a>
      </div>
    </div>
  </div>
);

export default Login;
