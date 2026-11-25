// Calendar tab icon (same 24x24 line style as src/ui/icons.tsx; kept here so the shared icon file is untouched).
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function CalendarIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.5} y={5} width={17} height={15} rx={3} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3.5 10 h17 M8 3 v4 M16 3 v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={15.5} cy={15} r={1.6} fill={color} />
    </Svg>
  );
}
