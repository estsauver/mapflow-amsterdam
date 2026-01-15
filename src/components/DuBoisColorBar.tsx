import React from 'react';

interface DuBoisColorBarProps {
  className?: string;
}

/**
 * Du Bois Color Bar - signature header element inspired by
 * U.S. Graphics Company and W.E.B. Du Bois's 1900 Paris Exposition visualizations
 */
const DuBoisColorBar = ({ className = '' }: DuBoisColorBarProps) => {
  return (
    <div className={`dubois-color-bar ${className}`}>
      <span className="bg-dubois-carmine" />
      <span className="bg-dubois-carmine" />
      <span className="bg-dubois-burgundy" />
      <span className="bg-dubois-prussian" />
      <span className="bg-dubois-steel" />
      <span className="bg-dubois-prussian" />
      <span className="bg-dubois-emerald" />
      <span className="bg-dubois-emerald" />
      <span className="bg-dubois-gold" />
      <span className="bg-dubois-gold" />
      <span className="bg-dubois-sepia" />
      <span className="bg-dubois-ink" />
    </div>
  );
};

export default DuBoisColorBar;
