import React, { useEffect, useState } from "react";
import PrintHeroImageData from "../components/matchAnalysis/PrintHeroImageData";
import PrintGeneralImages from "../components/images/PrintGeneralImages";
import { Hero } from "../domain/player";

const Images: React.FC = () => {
  const [heroData, setHeroData] = useState<Hero[]>([]);
  const [generalImages, setGeneralImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);

        // Fetch hero images
        const heroResponse = await fetch("https://assets.deadlock-api.com/v2/heroes");
        if (!heroResponse.ok) {
          throw new Error("Failed to fetch hero images");
        }
        const heroJson = await heroResponse.json();
        setHeroData(heroJson);

        // Fetch general images
        const generalResponse = await fetch("https://assets.deadlock-api.com/v1/images");
        if (!generalResponse.ok) {
          throw new Error("Failed to fetch general images");
        }
        const generalJson = await generalResponse.json();
        setGeneralImages(generalJson);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Deadlock API Images</h1>

      {/* General Images Section */}
      {Object.keys(generalImages).length > 0 && (
        <PrintGeneralImages images={generalImages} />
      )}

      {/* Hero Images Section */}
      {heroData.length > 0 && (
        <PrintHeroImageData heroData={heroData} />
      )}
    </div>
  );
};

export default Images;
