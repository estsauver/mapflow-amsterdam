import React from 'react';
import AmsterdamMap from '../components/AmsterdamMap';
import Navigation from '../components/Navigation';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <AmsterdamMap />
      <Navigation />
    </div>
  );
};

export default Index;