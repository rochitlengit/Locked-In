'use client';
import { motion } from 'framer-motion';

/**
 * The LockedIn brand mark — two rounded hooks in 180°-rotational symmetry,
 * reading as an interlocking "link/lock". Built as plain stroked paths
 * (round caps + joins) rather than traced outlines, so it stays perfectly
 * crisp at any size — a 24px sidebar badge and a 200px splash mark are the
 * same two <path> elements, just scaled.
 *
 * `animated` swaps the two paths for motion.path equivalents that draw
 * themselves in (stroke-dasharray reveal) and settle with a small spring —
 * used once, on the opening screen. Everywhere else (sidebar, login,
 * favicon) it renders static, since replaying a "logo assembling itself"
 * animation on every page nav would be more distracting than delightful.
 */
export function LogoMark({
  size = 32,
  color = '#F3E9D2',
  animated = false,
  className = '',
}: {
  size?: number;
  color?: string;
  animated?: boolean;
  className?: string;
}) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 25,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (!animated) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
        <path d="M 33,14 L 33,40 L 76,40" {...common} />
        <path d="M 67,86 L 67,60 L 24,60" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <motion.path
        d="M 33,14 L 33,40 L 76,40"
        {...common}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.62, ease: [0.34, 1.1, 0.4, 1] }, opacity: { duration: 0.15 } }}
      />
      <motion.path
        d="M 67,86 L 67,60 L 24,60"
        {...common}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.62, delay: 0.18, ease: [0.34, 1.1, 0.4, 1] }, opacity: { duration: 0.15, delay: 0.18 } }}
      />
    </svg>
  );
}

/** Mark + "Locked In." wordmark, stacked or inline. */
export function Logo({
  size = 32,
  color = '#F3E9D2',
  animated = false,
  stacked = true,
  className = '',
  wordClassName = '',
}: {
  size?: number;
  color?: string;
  animated?: boolean;
  stacked?: boolean;
  className?: string;
  wordClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} color={color} animated={animated} />
      <span
        className={`font-[800] leading-[0.92] tracking-tight ${wordClassName}`}
        style={{ fontFamily: "'Baloo 2', 'Bricolage Grotesque', sans-serif", color, fontSize: size * 0.44 }}
      >
        Locked{stacked && <br />}
        {stacked ? '' : ' '}In.
      </span>
    </div>
  );
}
