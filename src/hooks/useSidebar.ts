import { useState, useEffect } from 'react';

export function useSidebar() {
  // Get initial state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true; // Default to collapsed
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Save collapse state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isCollapsed,
    setIsCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  };
}