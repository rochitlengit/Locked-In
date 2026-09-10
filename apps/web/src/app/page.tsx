'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth';
import { LogoMark } from '@/components/Logo';

// The opening screen: the background photo, the mark drawing itself in,
// then the wordmark settling underneath it — then it hands off to
// /dashboard or /login, same destination logic the old instant-redirect
// root page used. Tap/click/key anywhere skips straight there.
export default function Home() {
  const router = useRouter();
  const { hydrate, token } = useAuthStore();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => {
      if (leaving) return;
      setLeaving(true);
      setTimeout(() => router.replace(token ? '/dashboard' : '/login'), reduced ? 80 : 360);
    };

    const timer = setTimeout(go, reduced ? 500 : 2400);
    const onSkip = () => go();
    window.addEventListener('pointerdown', onSkip);
    window.addEventListener('keydown', onSkip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onSkip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.main
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
          className="splash-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden cursor-pointer"
        >
          <div className="relative z-10 flex flex-col items-center">
            <LogoMark size={104} animated />
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5, ease: [0.34, 1.2, 0.4, 1] }}
              className="mt-5 text-center"
              style={{ fontFamily: "'Baloo 2', 'Bricolage Grotesque', sans-serif" }}
            >
              <div className="text-[38px] font-[800] leading-[0.9] tracking-tight text-[#F3E9D2]">
                Locked
                <br />
                In.
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.15, duration: 0.6 }}
              className="mt-6 text-[13px] text-white/50 tracking-wide"
            >
              Every task, hour and outcome — in one honest scoreboard.
            </motion.p>
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.6 }}
            className="absolute bottom-8 text-[11px] text-white/35 tracking-wide"
          >
            Tap anywhere to continue
          </motion.span>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
