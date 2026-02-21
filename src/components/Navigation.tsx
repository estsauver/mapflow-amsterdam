import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AboutDialog from './AboutDialog';
import ProjectsDialog from './ProjectsDialog';
import ContactDialog from './ContactDialog';
import ResearchDialog from './ResearchDialog';
import DuBoisColorBar from './DuBoisColorBar';

const Navigation = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Open dialogs when URL matches
  useEffect(() => {
    if (location.pathname === '/about') {
      setAboutOpen(true);
    } else if (location.pathname === '/contact') {
      setContactOpen(true);
    } else if (location.pathname.startsWith('/projects')) {
      setProjectsOpen(true);
    }
  }, [location.pathname]);

  // Handle about dialog close - navigate back to home
  const handleAboutOpenChange = (open: boolean) => {
    setAboutOpen(open);
    if (!open && location.pathname === '/about') {
      navigate('/');
    }
  };

  // Handle contact dialog close - navigate back to home
  const handleContactOpenChange = (open: boolean) => {
    setContactOpen(open);
    if (!open && location.pathname === '/contact') {
      navigate('/');
    }
  };

  // Handle projects dialog close - navigate back to home
  const handleProjectsOpenChange = (open: boolean) => {
    setProjectsOpen(open);
    if (!open && location.pathname.startsWith('/projects')) {
      navigate('/');
    }
  };

  // Handle opening dialogs - navigate to route
  const handleOpenAbout = () => {
    navigate('/about');
  };

  const handleOpenContact = () => {
    navigate('/contact');
  };

  const handleOpenProjects = () => {
    navigate('/projects');
  };

  const handleOpenResearch = () => {
    setResearchOpen(true);
  };

  return (
    <>
      <nav className="fixed top-8 right-8 z-10">
        <div className="dubois-panel overflow-hidden">
          <DuBoisColorBar />

          <div className="p-4">
            <div className="mb-4">
              <h1 className="dubois-title text-xl text-dubois-ink">
                Earl St Sauver
              </h1>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={handleOpenAbout}
                  className="dubois-btn dubois-btn-secondary w-full text-left text-sm"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenProjects}
                  className="dubois-btn dubois-btn-secondary w-full text-left text-sm"
                >
                  Projects
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenContact}
                  className="dubois-btn dubois-btn-secondary w-full text-left text-sm"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenResearch}
                  className="dubois-btn dubois-btn-secondary w-full text-left text-sm"
                >
                  Research
                </button>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="dubois-btn dubois-btn-secondary w-full text-left text-sm block"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <AboutDialog open={aboutOpen} onOpenChange={handleAboutOpenChange} />
      <ProjectsDialog open={projectsOpen} onOpenChange={handleProjectsOpenChange} />
      <ContactDialog open={contactOpen} onOpenChange={handleContactOpenChange} />
      <ResearchDialog open={researchOpen} onOpenChange={setResearchOpen} />
    </>
  );
};

export default Navigation;
