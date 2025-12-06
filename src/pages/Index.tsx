import React from 'react';
import FarmingGame from '../components/FarmingGame';
import Navigation from '../components/Navigation';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <FarmingGame />
      <Navigation />
    </div>
  );
};

export default Index;