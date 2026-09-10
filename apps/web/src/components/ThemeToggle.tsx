'use client';
import { useId } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 };
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Sun-to-moon toggle: a circle is cut by a second, sliding circle inside an
 * SVG mask — as the cutout slides in, the disc reads as a crescent moon. The
 * eight rays fold in and fade at the same time. One shape, one gesture.
 */
export default function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  const maskId = useId();

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
      className="relative h-8 w-8 rounded-full grid place-items-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
    >
      <motion.svg
        width={17}
        height={17}
        viewBox="0 0 24 24"
        animate={{ rotate: dark ? -14 : 0 }}
        transition={SPRING}
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            r={9}
            fill="black"
            animate={{ cx: dark ? 8 : 30, cy: dark ? 6 : -6 }}
            transition={SPRING}
          />
        </mask>

        <motion.g
          animate={{ opacity: dark ? 0 : 1, scale: dark ? 0.5 : 1 }}
          transition={SPRING}
          style={{ transformOrigin: '12px 12px' }}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          {RAYS.map((deg) => (
            <line
              key={deg}
              x1={12 + Math.cos((deg * Math.PI) / 180) * 7.5}
              y1={12 + Math.sin((deg * Math.PI) / 180) * 7.5}
              x2={12 + Math.cos((deg * Math.PI) / 180) * 10}
              y2={12 + Math.sin((deg * Math.PI) / 180) * 10}
            />
          ))}
        </motion.g>

        <motion.circle
          cx={12}
          cy={12}
          fill="currentColor"
          mask={`url(#${maskId})`}
          animate={{ r: dark ? 8.5 : 6 }}
          transition={SPRING}
        />
      </motion.svg>
    </button>
  );
}
