import { useContext } from 'react';
import { OnboardingContext } from '../contexts/OnboardingContext';

export function useOnboardingState() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingState must be used inside OnboardingProvider');
  return ctx;
}
