import React from 'react';
import { Header } from '../components/layout/Header';
import { IntegrationSurface } from '../components/layout/IntegrationSurface';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <IntegrationSurface />
    </div>
  );
};

export default App;
