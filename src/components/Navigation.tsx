import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AboutDialog from './AboutDialog';

const Navigation = () => {
  const location = useLocation();
  const [aboutOpen, setAboutOpen] = useState(false);
  
  const links = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav className="fixed top-8 right-8 z-10">
        <div className="glass-panel rounded-lg p-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`block px-4 py-2 rounded-md transition-all duration-300 ${
                    location.pathname === link.path
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-white/20'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => setAboutOpen(true)}
                className="w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
              >
                About
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
};

export default Navigation;