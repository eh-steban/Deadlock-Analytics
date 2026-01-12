import React from 'react';

export type TimeRange = 'full' | 'laning' | 'mid' | 'late';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges: { value: TimeRange; label: string }[] = [
    { value: 'full', label: 'Full Match' },
    { value: 'laning', label: 'Laning Phase' },
    { value: 'mid', label: 'Mid Game' },
    { value: 'late', label: 'Late Game' },
  ];

  return (
    <div className="flex gap-2 items-center">
      <label className="text-sm font-semibold text-gray-700">Time Range:</label>
      <div className="flex gap-2">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              selectedRange === range.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeRangeSelector;
