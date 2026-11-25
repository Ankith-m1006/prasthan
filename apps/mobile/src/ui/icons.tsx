// Simple line icons drawn by us (react-native-svg), 24x24 grid, so we need no icon package.
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type IconName = 'mic' | 'bus' | 'train' | 'plane' | 'bell' | 'speaker' | 'shop' | 'pin' | 'info' | 'keyboard' | 'gift';

const P: Record<IconName, (c: string) => React.ReactNode> = {
  mic: (c) => <><Rect x={9} y={3} width={6} height={11} rx={3} stroke={c} strokeWidth={2} fill="none" /><Path d="M5 11 a7 7 0 0 0 14 0 M12 18 v3 M8 21 h8" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" /></>,
  bus: (c) => <><Rect x={4} y={3} width={16} height={15} rx={3} stroke={c} strokeWidth={2} fill="none" /><Line x1={4} y1={11} x2={20} y2={11} stroke={c} strokeWidth={2} /><Circle cx={8} cy={15} r={1.3} fill={c} /><Circle cx={16} cy={15} r={1.3} fill={c} /><Path d="M7 18 v3 M17 18 v3" stroke={c} strokeWidth={2} strokeLinecap="round" /></>,
  train: (c) => <><Rect x={5} y={3} width={14} height={14} rx={4} stroke={c} strokeWidth={2} fill="none" /><Line x1={5} y1={10} x2={19} y2={10} stroke={c} strokeWidth={2} /><Path d="M8 21 l2 -4 M16 21 l-2 -4" stroke={c} strokeWidth={2} strokeLinecap="round" /></>,
  plane: (c) => <Path d="M2 13 l20 -8 -6 16 -3 -7 z M13 14 l-3 6" stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round" />,
  bell: (c) => <Path d="M6 16 V11 a6 6 0 0 1 12 0 v5 l2 2 H4 z M10 20 a2 2 0 0 0 4 0" stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round" />,
  speaker: (c) => <Path d="M4 9 h4 l5 -4 v14 l-5 -4 H4 z M16 9 a4 4 0 0 1 0 6 M18.5 6.5 a8 8 0 0 1 0 11" stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />,
  shop: (c) => <Path d="M4 9 l2 -5 h12 l2 5 v11 H4 z M4 9 h16 M9 20 v-6 h6 v6" stroke={c} strokeWidth={2} fill="none" strokeLinejoin="round" />,
  pin: (c) => <><Path d="M12 21 s7 -6 7 -12 a7 7 0 0 0 -14 0 c0 6 7 12 7 12 z" stroke={c} strokeWidth={2} fill="none" /><Circle cx={12} cy={9} r={2.5} stroke={c} strokeWidth={2} fill="none" /></>,
  info: (c) => <><Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} fill="none" /><Path d="M12 11 v6 M12 7.5 v0.5" stroke={c} strokeWidth={2.4} strokeLinecap="round" /></>,
  keyboard: (c) => <><Rect x={3} y={6} width={18} height={12} rx={2} stroke={c} strokeWidth={2} fill="none" /><Path d="M7 10 h1 M11 10 h1 M15 10 h1 M8 14 h8" stroke={c} strokeWidth={2} strokeLinecap="round" /></>,
  gift: (c) => <><Rect x={4} y={10} width={16} height={10} stroke={c} strokeWidth={2} fill="none" /><Rect x={3} y={7} width={18} height={3} stroke={c} strokeWidth={2} fill="none" /><Path d="M12 7 v13 M12 7 c-2 -4 -6 -3 -5 0 M12 7 c2 -4 6 -3 5 0" stroke={c} strokeWidth={2} fill="none" /></>,
};

export function Icon({ name, size = 24, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24">{P[name](color)}</Svg>;
}
