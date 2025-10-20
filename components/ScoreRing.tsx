import React, { useState, useEffect } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 60, strokeWidth = 5 }) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const getScoreColor = (value: number) => {
    if (value >= 7) return '#238636'; // highlight green
    if (value >= 5) return '#d29922'; // yellow-ish
    return '#DA3633'; // red
  };
  
  // These are now driven by the animated displayPercentage state
  const color = getScoreColor(displayPercentage / 10);
  const offset = circumference - (displayPercentage / 100) * circumference;
  const finalPercentage = Math.round(score * 10);

  useEffect(() => {
    let isCancelled = false;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const animateValue = (start: number, end: number, duration: number) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (isCancelled) return;
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        setDisplayPercentage(value);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    const runAnimationSequence = async () => {
        // Ensure initial render is at 0 before starting
        setDisplayPercentage(0);
        await sleep(150);
        if (isCancelled) return;

        // 1. Ramp up to 100%
        animateValue(0, 100, 600);
        await sleep(650);
        if (isCancelled) return;

        // 2. Drop back to 0%
        animateValue(100, 0, 400);
        await sleep(450);
        if (isCancelled) return;
        
        // 3. Animate to final score
        animateValue(0, finalPercentage, 800);
    };

    runAnimationSequence();

    return () => {
      isCancelled = true;
    };
  }, [score, finalPercentage]);

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
          style={{ transition: 'stroke 0.2s linear' }}
        />
      </svg>
      <div className="absolute flex items-center justify-center w-full h-full">
        <span className="text-white font-bold text-lg tabular-nums">{displayPercentage}</span>
        <span className="text-white text-[8px]">%</span>
      </div>
    </div>
  );
};

export default ScoreRing;
