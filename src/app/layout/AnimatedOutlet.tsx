import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactElement } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { pageVariants } from '@/shared/motion/transitions';

/** Keeps the outlet of the page that is animating out from switching to the new page mid-exit. */
function FrozenOutlet({ outlet }: { outlet: ReactElement | null }) {
  const [frozen] = useState(outlet);
  return frozen;
}

/** Route outlet with a fade + rise page transition (reduced motion handled by MotionConfig). */
export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <FrozenOutlet outlet={outlet} />
      </motion.div>
    </AnimatePresence>
  );
}
