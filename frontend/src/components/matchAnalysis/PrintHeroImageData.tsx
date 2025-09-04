import React from "react";
import { Hero } from "../../types/Player";

type Props = {
  heroData: Hero[];
};

const PrintHeroImageData: React.FC<Props> = ({ heroData }) => {
  return (
    <div className='hero-image-data col-span-2 mt-40 gap-4'>
      <h3>All Hero Images (from API)</h3>
      <div className='g-24 flex'>
        {heroData.map((hero) => (
          <div
            key={hero.id}
            className='mb-24 min-w-200'
          >
            <div className='mb-2 font-semibold'>{hero.name}</div>
            {hero.images &&
              Object.entries(hero.images).map(([label, url]) => (
                <div
                  key={label}
                  className='mb-6'
                >
                  <span className='text-sm text-gray-600'>{label}:</span>
                  <img
                    src={url as string}
                    alt={label}
                    className='max-h-30 max-w-30'
                  />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintHeroImageData;
