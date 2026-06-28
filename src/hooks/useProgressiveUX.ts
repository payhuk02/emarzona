import { useContext } from 'react';
import { ProgressiveUXContext } from '@/contexts/ProgressiveUXContext';

export function useProgressiveUX() {
  const context = useContext(ProgressiveUXContext);
  if (context === undefined) {
    throw new Error('useProgressiveUX must be used within a ProgressiveUXProvider');
  }
  return context;
}
