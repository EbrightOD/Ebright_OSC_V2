import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/client';
import { OnboardingProvider } from './contexts/OnboardingContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
