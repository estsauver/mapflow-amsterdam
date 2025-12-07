import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="fixed top-8 right-8 z-10">
      <div className="glass-panel rounded-lg p-4">
        <div className="mb-4">
          <Link to="/" className="text-2xl text-foreground hover:text-primary transition-colors">
            Earl St Sauver
          </Link>
        </div>
        <ul className="space-y-2">
          <li>
            <Link
              to="/about"
              className="block w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/projects"
              className="block w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
            >
              Projects
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="block w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
