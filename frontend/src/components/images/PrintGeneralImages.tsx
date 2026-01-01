import React from "react";

type Props = {
  images: Record<string, string>;
};

const PrintGeneralImages: React.FC<Props> = ({ images }) => {
  return (
    <div className='general-image-data col-span-2 mt-40 gap-4'>
      <h3>All General Images (from API)</h3>
      <div className='g-2 grid grid-cols-3 lg:grid-cols-5'>
        {Object.entries(images).map(([key, url]) => (
          <div
            key={key}
            className='mb-24'
          >
            <div className='mb-2 font-semibold text-sm'>{key}</div>
            <img
              src={url}
              alt={key}
              className='max-h-30 max-w-30'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintGeneralImages;
