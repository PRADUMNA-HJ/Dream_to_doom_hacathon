import React from 'react';
import { GameOrchestrator } from './GameOrchestrator';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameOrchestrator />
    </ErrorBoundary>
  );
};

export default App;
