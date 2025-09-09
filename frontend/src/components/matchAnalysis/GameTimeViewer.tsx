import React from "react";

interface GameTimeViewerProps {
  currentTick: number;
  setCurrentTick: (time: number | ((t: number) => number)) => void;
  maxTime: number;
  startRepeat: (direction: "back" | "forward") => void;
  stopRepeat: () => void;
}

const GameTimeViewer: React.FC<GameTimeViewerProps> = ({
  currentTick,
  setCurrentTick,
  maxTime,
  startRepeat,
  stopRepeat,
}) => {
  return (
    <div
      style={{
        background: "#f7f7f7",
        padding: "8px 0",
        borderTop: "1px solid #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <button
        onClick={() => setCurrentTick((t) => Math.max(0, t - 1))}
        onMouseDown={() => startRepeat("back")}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => startRepeat("back")}
        onTouchEnd={stopRepeat}
        disabled={currentTick <= 0}
        style={{
          padding: "2px 10px",
          fontSize: "1.2em",
          borderRadius: 4,
          border: "1px solid #bbb",
          background: currentTick <= 0 ? "#eee" : "#fff",
          cursor: currentTick <= 0 ? "not-allowed" : "pointer",
        }}
        aria-label='Previous Tick'
      >
        ◀
      </button>
      <input
        type='range'
        min={0}
        max={maxTime}
        value={currentTick}
        onChange={(e) => setCurrentTick(Number(e.target.value))}
        style={{ width: "70%" }}
      />
      <button
        onClick={() => setCurrentTick((t) => Math.min(maxTime, t + 1))}
        onMouseDown={() => startRepeat("forward")}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => startRepeat("forward")}
        onTouchEnd={stopRepeat}
        disabled={currentTick >= maxTime}
        style={{
          padding: "2px 10px",
          fontSize: "1.2em",
          borderRadius: 4,
          border: "1px solid #bbb",
          background: currentTick >= maxTime ? "#eee" : "#fff",
          cursor: currentTick >= maxTime ? "not-allowed" : "pointer",
        }}
        aria-label='Next Tick'
      >
        ▶
      </button>
    </div>
  );
};

export default GameTimeViewer;
