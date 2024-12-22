'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MobilePlayer from './MobilePlayer';
import EnhancedPlayer from './EnhancedPlayer';
import EnhancedQueuePanel from './EnhancedQueuePanel';
import usePlayerStore from '../store/usePlayerStore';

export default function RootLayoutClient() {
  const [isMobile, setIsMobile] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const pathname = usePathname();
  const { currentTrack } = usePlayerStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Close queue panel when navigating
  useEffect(() => {
    setIsQueueOpen(false);
  }, [pathname]);

  const handleQueueClick = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  if (!currentTrack) return null;

  return (
    <>
      {!isMobile && (
        <EnhancedQueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      )}
      
      {/* Conditional Player Rendering */}
      {isMobile ? <MobilePlayer /> : <EnhancedPlayer onQueueClick={handleQueueClick} />}
    </>
  );
} 