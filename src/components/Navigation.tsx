import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AboutDialog from './AboutDialog';
import ProjectsDialog from './ProjectsDialog';
import ContactDialog from './ContactDialog';

const Navigation = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  
  return (
    <>
      <nav className="fixed top-8 right-8 z-10">
        <div className="glass-panel rounded-lg p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="block px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
              >
                Home
              </Link>
            </li>
            <li>
              <button
                onClick={() => setProjectsOpen(true)}
                className="w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
              >
                Projects
              </button>
            </li>
            <li>
              <button
                onClick={() => setContactOpen(true)}
                className="w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
              >
                Contact
              </button>
            </li>
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
      <ProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default Navigation;