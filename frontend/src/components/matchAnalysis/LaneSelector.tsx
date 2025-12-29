import React from 'react';

interface LaneSelectorProps {
  selectedLane: number | null;
  onLaneChange: (lane: number | null) => void;
}

const LaneSelector: React.FC<LaneSelectorProps> = ({ selectedLane, onLaneChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onLaneChange(value === '' ? null : Number(value));
  };

  return (
    <div className="flex justify-center w-full py-4 md:py-6">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-lg shadow-md p-4">
        <select
          value={selectedLane === null ? '' : selectedLane}
          onChange={handleChange}
          className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="">All Lanes</option>
          <option value="1">Lane 1 (Yellow)</option>
          <option value="4">Lane 4 (Blue)</option>
          <option value="6">Lane 6 (Green)</option>
        </select>
      </div>
    </div>
  );
};

export default LaneSelector;
