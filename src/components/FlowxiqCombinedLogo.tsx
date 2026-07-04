import React from 'react';

interface Props {
  height?: number;
  textColor?: string;
  symbolColor?: string;   // The blue strand (default #3D7FFF)
  symbolBgColor?: string; // The white/contrasting strand (default #FFFFFF)
  className?: string;
  style?: React.CSSProperties;
}

export default function FlowxiqCombinedLogo({
  height = 32,
  textColor = '#FFFFFF',
  symbolColor = '#3D7FFF',
  symbolBgColor = '#FFFFFF',
  className,
  style,
}: Props) {
  // Aspect ratio is 4.8:1 (240:50)
  const width = Math.round(height * 4.8);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 50"
      width={width}
      height={height}
      className={className}
      style={style}
      aria-label="flowxiq logo"
      role="img"
    >
      {/* Contrasting strand (drawn first so it goes behind) */}
      <path
        d="M 12,35 C 26,35 28,15 42,15"
        fill="none"
        stroke={symbolBgColor}
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      {/* Primary blue strand (drawn second so it goes in front) */}
      <path
        d="M 12,15 C 26,15 28,35 42,35"
        fill="none"
        stroke={symbolColor}
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      {/* Brand Text */}
      <text
        x="58"
        y="38"
        fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="44"
        fontWeight="600"
        letterSpacing="-1.5"
        fill={textColor}
      >
        flowxiq
      </text>
    </svg>
  );
}
