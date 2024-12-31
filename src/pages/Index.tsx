import React from 'react';
import AmsterdamMap from '../components/AmsterdamMap';
import Navigation from '../components/Navigation';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <AmsterdamMap />
      <Navigation />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel p-8 rounded-lg max-w-2xl w-full mx-auto animate-fade-in">
          <span className="inline-block px-3 py-1 text-sm rounded-full bg-primary/10 text-primary-foreground mb-4">
            Welcome
          </span>
          <h1 className="text-4xl font-bold mb-4 animate-slide-up">
            Your Name
          </h1>
          <p className="text-lg text-muted-foreground animate-slide-up">
            A brief introduction about yourself and what you do. This text will be replaced with your personal information.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;