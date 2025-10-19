import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 60, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  const getScoreColor = (value: number) => {
    if (value >= 7) return '#238636'; // highlight green
    if (value >= 5) return '#d29922'; // yellow-ish
    return '#DA3633'; // red
  };

  const color = getScoreColor(score);
  const percentage = Math.round(score * 10);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-gray-700/50"
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex items-center justify-center w-full h-full">
        <span className="text-white font-bold text-lg">{percentage}</span>
        <span className="text-white text-[8px]">%</span>
      </div>
    </div>
  );
};

export default ScoreRing;
