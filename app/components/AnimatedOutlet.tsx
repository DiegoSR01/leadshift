import { AnimatePresence, motion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { cn } from './ui/utils';

interface AnimatedOutletProps {
  className?: string;
  yOffset?: number;
  transitionKey?: (pathname: string) => string;
}

export function AnimatedOutlet({
  className,
  yOffset = 14,
  transitionKey,
}: AnimatedOutletProps) {
  const location = useLocation();
  const key = transitionKey ? transitionKey(location.pathname) : location.pathname;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        className={cn('route-transition-surface', className)}
        initial={{ opacity: 0, y: yOffset, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}