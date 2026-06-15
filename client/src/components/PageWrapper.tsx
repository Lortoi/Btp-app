import Sidebar from '@/components/Sidebar'
import { useLocation } from 'wouter'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { agentDebugLog } from '@/lib/agentDebugLog'
import { AppTopBar } from '@/components/AppTopBar'
import { dashboardLayoutStyle, dashboardLayoutClass } from '@/lib/dashboardLayoutStyle'

interface PageWrapperProps {
  children: React.ReactNode
}

const contentVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export function PageWrapper({ children }: PageWrapperProps) {
  const [location, setLocation] = useLocation();

  // #region agent log
  useEffect(() => {
    agentDebugLog(
      "PageWrapper.tsx:effect",
      "route content mounted",
      { location },
      "H1-framer-animatepresence",
    );
    return () => {
      agentDebugLog(
        "PageWrapper.tsx:cleanup",
        "route content cleanup",
        { location },
        "H1-framer-animatepresence",
      );
    };
  }, [location]);
  // #endregion

  return (
    <div className={dashboardLayoutClass} style={dashboardLayoutStyle}>
      <Sidebar />

      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={contentVariants}
          className="relative flex w-full flex-col overflow-hidden overflow-x-hidden"
        >
          <AppTopBar />

          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
