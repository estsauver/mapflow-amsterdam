import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AboutDialog from './AboutDialog';
import ProjectsDialog from './ProjectsDialog';
import ContactDialog from './ContactDialog';

const Navigation = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Open projects dialog when URL matches /projects or /projects/:id
  useEffect(() => {
    if (location.pathname.startsWith('/projects')) {
      setProjectsOpen(true);
    }
  }, [location.pathname]);

  // Handle projects dialog close - navigate back to home
  const handleProjectsOpenChange = (open: boolean) => {
    setProjectsOpen(open);
    if (!open && location.pathname.startsWith('/projects')) {
      navigate('/');
    }
  };

  // Handle opening projects - navigate to /projects
  const handleOpenProjects = () => {
    navigate('/projects');
  };

  return (
    <>
      <nav className="fixed top-8 right-8 z-10">
        <div className="glass-panel rounded-lg p-4">
          <div className="mb-4">
            <h1 className="text-2xl text-foreground">
              Earl St Sauver
            </h1>
          </div>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setAboutOpen(true)}
                className="w-full text-left px-4 py-2 rounded-md transition-all duration-300 hover:bg-white/20"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={handleOpenProjects}
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
          </ul>
        </div>
      </nav>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <ProjectsDialog open={projectsOpen} onOpenChange={handleProjectsOpenChange} />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default Navigation;
