import React from "react";
import { formatSecondstoMMSS } from "../../utils/time";

interface MatchTimeViewerProps {
  currentTick: number;
  setCurrentTick: (time: number | ((t: number) => number)) => void;
  total_match_time_s: number;
  startRepeat: (direction: "back" | "forward") => void;
  stopRepeat: () => void;
}

const MatchTimeViewer: React.FC<MatchTimeViewerProps> = ({
  currentTick,
  setCurrentTick,
  total_match_time_s,
  startRepeat,
  stopRepeat,
}) => {
  const currentTime = formatSecondstoMMSS(currentTick);
  const totalTime = formatSecondstoMMSS(total_match_time_s);

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-lg shadow-md p-4">
        {/* Time Display */}
        <div className="text-center mb-3 font-semibold text-gray-700">
          {currentTime} / {totalTime}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentTick((t) => Math.max(0, t - 1))}
            onMouseDown={() => startRepeat("back")}
            onMouseUp={stopRepeat}
            onMouseLeave={stopRepeat}
            onTouchStart={() => startRepeat("back")}
            onTouchEnd={stopRepeat}
            disabled={currentTick <= 0}
            className={`px-3 py-1 text-lg rounded border transition-colors ${
              currentTick <= 0
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer shadow-sm"
            }`}
            aria-label="Previous Tick"
          >
            ◀
          </button>

          <button
            onClick={() =>
              setCurrentTick((t) => Math.min(total_match_time_s, t + 1))
            }
            onMouseDown={() => startRepeat("forward")}
            onMouseUp={stopRepeat}
            onMouseLeave={stopRepeat}
            onTouchStart={() => startRepeat("forward")}
            onTouchEnd={stopRepeat}
            disabled={currentTick >= total_match_time_s}
            className={`px-3 py-1 text-lg rounded border transition-colors ${
              currentTick >= total_match_time_s
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer shadow-sm"
            }`}
            aria-label="Next Tick"
          >
            ▶
          </button>

          <input
            type="range"
            min={0}
            max={total_match_time_s}
            value={currentTick}
            onChange={(e) => setCurrentTick(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

export default MatchTimeViewer;
