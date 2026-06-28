import React, { createContext, useContext, useState, useEffect } from 'react';

type UXLevel = 'essential' | 'expert';

interface ProgressiveUXContextType {
  uxLevel: UXLevel;
  isExpertMode: boolean;
  setUxLevel: (level: UXLevel) => void;
  toggleExpertMode: () => void;
}

const STORAGE_KEY = 'emarzona:ux_level';

export const ProgressiveUXContext = createContext<ProgressiveUXContextType>({
  uxLevel: 'expert',
  isExpertMode: true,
  setUxLevel: () => {},
  toggleExpertMode: () => {},
});

export function ProgressiveUXProvider({ children }: { children: React.ReactNode }) {
  const [uxLevel, setUxLevelState] = useState<UXLevel>(() => {
    // Par défaut, un nouveau vendeur arrive en mode essentiel pour éviter l'overdose
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as UXLevel) || 'essential';
  });

  const setUxLevel = (level: UXLevel) => {
    setUxLevelState(level);
    localStorage.setItem(STORAGE_KEY, level);
  };

  const toggleExpertMode = () => {
    setUxLevel(uxLevel === 'essential' ? 'expert' : 'essential');
  };

  // Pour supporter le SSR ou des bugs d'hydratation, on s'assure de synchro le state
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setUxLevelState(e.newValue as UXLevel);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ProgressiveUXContext.Provider
      value={{
        uxLevel,
        isExpertMode: uxLevel === 'expert',
        setUxLevel,
        toggleExpertMode,
      }}
    >
      {children}
    </ProgressiveUXContext.Provider>
  );
}
