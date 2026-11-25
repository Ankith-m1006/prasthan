// Soft "frosted" surfaces. Web gets CSS backdrop blur, gradients and diffuse shadows;
// native falls back to translucent fills (no extra native dependency).
import { Platform, type ViewStyle } from 'react-native';

const isWeb = Platform.OS === 'web';

/** Web-only CSS (backdrop-filter, background-image, box-shadow) that RN's ViewStyle type does not list. */
export function web(css: Record<string, string>): ViewStyle {
  return (isWeb ? css : {}) as unknown as ViewStyle;
}

/** Hex colour + alpha (0..1) as rgba(). */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Frosted panel fill: translucent white, blurred behind on web. */
export function frost(strength = 0.62, blur = 18): ViewStyle {
  return {
    backgroundColor: `rgba(255, 255, 255, ${isWeb ? strength : Math.min(0.92, strength + 0.22)})`,
    ...web({
      backdropFilter: `blur(${blur}px) saturate(140%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
      boxShadow: '0 18px 48px -24px rgba(30, 26, 51, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    }),
  };
}

/** A soft tinted glow (for warnings, alerts, gifting): colour wash fading from one corner. */
export function tint(hex: string, a = 0.1): ViewStyle {
  return {
    backgroundColor: alpha(hex, isWeb ? a * 0.55 : a),
    ...web({
      backgroundImage: `radial-gradient(120% 140% at 0% 0%, ${alpha(hex, a * 1.4)} 0%, ${alpha(hex, a * 0.35)} 55%, rgba(255,255,255,0.35) 100%)`,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    }),
  };
}

/** Diffuse coloured glow under a solid pill (primary buttons, mic). */
export function glow(hex: string, a = 0.45, size = 28): ViewStyle {
  return isWeb
    ? web({ boxShadow: `0 12px ${size}px -10px ${alpha(hex, a)}` })
    : { shadowColor: hex, shadowOpacity: a, shadowRadius: size / 2, shadowOffset: { width: 0, height: 8 }, elevation: 4 };
}
