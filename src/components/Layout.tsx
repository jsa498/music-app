'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  QueueListIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import usePlayerStore from '../store/usePlayerStore';
import EnhancedQueuePanel from './EnhancedQueuePanel';
import EnhancedPlayer from './EnhancedPlayer';

interface LayoutProps {
  children: React.ReactNode;
}

interface Playlist {
  _id: string;
  name: string;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { isQueueVisible, toggleQueueVisibility } = usePlayerStore();
  const [isEnhancedQueueOpen, setIsEnhancedQueueOpen] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set sidebar width CSS variable
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        isSidebarCollapsed ? '72px' : '240px'
      );
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [isSidebarCollapsed, isMobile]);

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists');
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    fetchPlaylists();
  }, []);

  const navigationItems = [
    { name: 'Home', icon: HomeIcon, href: '/' },
    { name: 'Search', icon: MagnifyingGlassIcon, href: '/search' },
    { name: 'Library', icon: MusicalNoteIcon, href: '/library' },
    { name: 'Queue', icon: QueueListIcon, onClick: () => setIsEnhancedQueueOpen(true) }
  ];

  const sidebarVariants = {
    expanded: { width: '240px' },
    collapsed: { width: '72px' }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Top Navigation */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="flex-1 flex justify-center">
              <Link href="/" className="text-xl font-bold">
                Music
              </Link>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-2">
                {navigationItems.map((item) => (
                  <div key={item.name} className="mb-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-white/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-6 h-6 mr-4" />
                        <span>{item.name}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          item.onClick?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-white/10"
                      >
                        <item.icon className="w-6 h-6 mr-4" />
                        <span>{item.name}</span>
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add EnhancedQueuePanel */}
      <EnhancedQueuePanel 
        isOpen={isEnhancedQueueOpen} 
        onClose={() => setIsEnhancedQueueOpen(false)} 
      />

      <div className="flex h-full">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <motion.aside
            initial={false}
            animate={isSidebarCollapsed ? 'collapsed' : 'expanded'}
            variants={sidebarVariants}
            className="fixed left-0 top-0 h-full bg-[#030303] border-r border-white/10 z-30 flex flex-col"
          >
            {/* Logo and Toggle */}
            <div className="flex items-center justify-between p-4">
              {!isSidebarCollapsed && (
                <Link href="/" className="flex items-center gap-2">
                  <MusicalNoteIcon className="w-8 h-8 text-primary" />
                  <span className="text-xl font-bold">Music</span>
                </Link>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                {isSidebarCollapsed ? (
                  <ChevronRightIcon className="w-5 h-5" />
                ) : (
                  <ChevronLeftIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {navigationItems.map((item) => (
                  <div key={item.name} className="mb-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                          ${isSidebarCollapsed ? 'justify-center' : ''}
                          text-[#aaaaaa] hover:text-white hover:bg-white/5`}
                      >
                        <item.icon className="w-5 h-5" />
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                          ${isSidebarCollapsed ? 'justify-center' : ''}
                          ${item.name === 'Queue' && isEnhancedQueueOpen ? 'bg-white/10 text-white' : 'text-[#aaaaaa] hover:text-white hover:bg-white/5'}`}
                      >
                        <item.icon className="w-5 h-5" />
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Playlists Section */}
            {!isSidebarCollapsed && (
              <div className="flex-1 px-2 mt-4 overflow-hidden">
                <h2 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
                  Playlists
                </h2>
                <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist._id}
                      href={`/playlist/${playlist._id}`}
                      className="block px-4 py-2 text-sm text-[#aaaaaa] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      {playlist.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        )}

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto pb-24 px-8 py-6"
          style={{
            marginLeft: isMobile ? 0 : isSidebarCollapsed ? '64px' : '240px'
          }}
        >
          <div className="max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Player */}
      {currentTrack && (
        <div
          className="fixed bottom-0 right-0 z-50"
          style={{
            left: isMobile ? 0 : isSidebarCollapsed ? '64px' : '240px'
          }}
        >
          <EnhancedPlayer onQueueClick={() => setIsEnhancedQueueOpen(true)} />
        </div>
      )}
    </div>
  );
} 