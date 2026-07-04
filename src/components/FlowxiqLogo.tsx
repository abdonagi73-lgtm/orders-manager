// FlowxiqLogo — inline SVG wordmark, never has loading issues
// color: text color (default white for dark backgrounds, or '#1E2533' for light)
// height: rendered height in px

interface Props {
  color?: string;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FlowxiqLogo({ color = '#FFFFFF', height = 28, className, style }: Props) {
  // Aspect ratio of wordmark is approx 4.8:1
  const width = Math.round(height * 4.8);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 50"
      width={width}
      height={height}
      className={className}
      style={style}
      aria-label="flowxiq"
      role="img"
    >
      <text
        x="50%"
        y="42"
        textAnchor="middle"
        fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="52"
        fontWeight="600"
        letterSpacing="-2"
        fill={color}
      >
        flowxiq
      </text>
    </svg>
  );
}
