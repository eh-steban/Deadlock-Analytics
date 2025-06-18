import React from 'react';

interface GameTimeViewerProps {
  currentTime: number;
  setCurrentTime: (time: number | ((t: number) => number)) => void;
  maxTime: number;
  startRepeat: (direction: 'left' | 'right') => void;
  stopRepeat: () => void;
}

const GameTimeViewer: React.FC<GameTimeViewerProps> = ({
  currentTime,
  setCurrentTime,
  maxTime,
  startRepeat,
  stopRepeat,
}) => (
  <div style={{ background: '#f7f7f7', padding: '8px 0', borderTop: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <button
      onClick={() => setCurrentTime(t => Math.max(0, t - 1))}
      onMouseDown={() => startRepeat('left')}
      onMouseUp={stopRepeat}
      onMouseLeave={stopRepeat}
      onTouchStart={() => startRepeat('left')}
      onTouchEnd={stopRepeat}
      disabled={currentTime <= 0}
      style={{ padding: '2px 10px', fontSize: '1.2em', borderRadius: 4, border: '1px solid #bbb', background: currentTime <= 0 ? '#eee' : '#fff', cursor: currentTime <= 0 ? 'not-allowed' : 'pointer' }}
      aria-label="Previous Tick"
    >
      ◀
    </button>
    <input
      type="range"
      min={0}
      max={maxTime}
      value={currentTime}
      onChange={e => setCurrentTime(Number(e.target.value))}
      style={{ width: '70%' }}
    />
    <button
      onClick={() => setCurrentTime(t => Math.min(maxTime, t + 1))}
      onMouseDown={() => startRepeat('right')}
      onMouseUp={stopRepeat}
      onMouseLeave={stopRepeat}
      onTouchStart={() => startRepeat('right')}
      onTouchEnd={stopRepeat}
      disabled={currentTime >= maxTime}
      style={{ padding: '2px 10px', fontSize: '1.2em', borderRadius: 4, border: '1px solid #bbb', background: currentTime >= maxTime ? '#eee' : '#fff', cursor: currentTime >= maxTime ? 'not-allowed' : 'pointer' }}
      aria-label="Next Tick"
    >
      ▶
    </button>
    <span style={{ marginLeft: 8 }}>Tick: {currentTime}</span>
  </div>
);

export default GameTimeViewer;
