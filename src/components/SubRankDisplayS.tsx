import React from 'react';

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'Mythic';
export type SubRank =
  | 'E-' | 'E' | 'E+'
  | 'D-' | 'D' | 'D+'
  | 'C-' | 'C' | 'C+'
  | 'B-' | 'B' | 'B+'
  | 'A-' | 'A' | 'A+'
  | 'S-' | 'S' | 'S+'
  | 'SS-' | 'SS' | 'SS+'
  | 'Mythic';

export interface Threshold {
  min: number;
  rank: Rank;
}

interface SubRankResult {
  rank: Rank;
  modifier: '-' | '' | '+';
  percentToNext: number;
}

interface Props {
  value: number;
  thresholds: Threshold[];
  inverted?: boolean; // NEW: pass true for speed tests
}

// Modified logic to handle both normal and inverted scoring
function computeSubRank(value: number, thresholds: Threshold[], inverted: boolean): SubRankResult {
  const sorted = inverted ? [...thresholds].sort((a, b) => a.min - b.min) : [...thresholds].sort((a, b) => b.min - a.min);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const matched = inverted ? value <= current.min : value >= current.min;

    if (matched) {
      if (!next) {
        return { rank: current.rank, modifier: '', percentToNext: 100 };
      }

      const span = Math.abs(next.min - current.min);
      const progress = span === 0 ? 1 : inverted
        ? (current.min - value) / span
        : (value - current.min) / span;

      let modifier: '-' | '' | '+' = '';
      if (progress < 0.33) modifier = '-';
      else if (progress < 0.66) modifier = '';
      else modifier = '+';

      return {
        rank: current.rank,
        modifier,
        percentToNext: Math.min(100, Math.max(0, Math.round(progress * 100))),
      };
    }
  }

  return { rank: 'E', modifier: '-', percentToNext: 0 };
}

const SubRankDisplay: React.FC<Props> = ({ value, thresholds, inverted = false }) => {
  const { rank, modifier, percentToNext } = computeSubRank(value, thresholds, inverted);
  const label = `${rank}${modifier}` as SubRank;

  const radius = 30;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentToNext / 100) * circumference;

  return (
    <div className="relative w-[60px] h-[60px]">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#3b82f6"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-700">
        {label}
      </span>
    </div>
  );
};

export default SubRankDisplay;
