import Sidebar from '@/components/Sidebar'
import { useLocation } from 'wouter'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { agentDebugLog } from '@/lib/agentDebugLog'
import { AppTopBar } from '@/components/AppTopBar'

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
  const [location] = useLocation();

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
    <div className="flex min-h-screen relative overflow-hidden bg-[#0A0A0A]">
      {/* Sidebar - drawer < lg, fixed >= lg */}
      <Sidebar />

      {/* Main Content - animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={contentVariants}
          className="flex-1 flex flex-col relative z-10 lg:ml-64 overflow-hidden overflow-x-hidden w-full max-w-full border-l border-[#222222]"
        >
          {/* Top bar — menu mobile + toggle thème */}
          <AppTopBar />

          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

