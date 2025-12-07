import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import FarmingGame from '@/components/FarmingGame';
import EstimatorGame from '@/components/EstimatorGame';
import SqlGame from '@/components/SqlGame';
import SpotlightGame from '@/components/SpotlightGame';
import StorybookGame from '@/components/StorybookGame';

interface ProjectData {
  id: string;
  name: string;
  role?: string;
  description: string;
  hasGame: boolean;
  link?: string;
}

const PROJECTS: ProjectData[] = [
  {
    id: 'apollo',
    name: 'Apollo Agriculture',
    role: 'Founder, CTO (2015-2023)',
    description: 'Providing smallholder farmers in Africa with access to credit, high-quality seeds, fertilizer, and data-driven agronomic advice.',
    hasGame: true,
  },
  {
    id: 'universal-estimator',
    name: 'Universal Estimator',
    description: 'AI-powered estimation tool using token probability distributions to reveal true uncertainty in software estimates.',
    hasGame: true,
    link: 'https://universalestimator.com',
  },
  {
    id: 'nosql',
    name: 'No, SQL',
    description: 'Examples showing how to accomplish tasks often mistakenly thought to require NoSQL.',
    hasGame: true,
    link: 'https://nocommasql.com',
  },
  {
    id: 'dspy',
    name: 'dspy-spotlight',
    description: 'Prompt injection detection for DSPy - finding the double agents hiding in your inputs.',
    hasGame: true,
    link: 'https://github.com/estsauver/dspy-spotlight',
  },
  {
    id: 'childrens',
    name: "(Unnamed) Children's Book Publisher",
    description: 'Creating magical bedtime stories with AI-generated tales and illustrations.',
    hasGame: true,
  },
];

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const currentProjectIndex = PROJECTS.findIndex((p) => p.id === projectId);
  const currentProject = PROJECTS[currentProjectIndex];

  const goToPrevProject = useCallback(() => {
    const prevIndex = currentProjectIndex > 0 ? currentProjectIndex - 1 : PROJECTS.length - 1;
    navigate(`/projects/${PROJECTS[prevIndex].id}`);
  }, [currentProjectIndex, navigate]);

  const goToNextProject = useCallback(() => {
    const nextIndex = currentProjectIndex < PROJECTS.length - 1 ? currentProjectIndex + 1 : 0;
    navigate(`/projects/${PROJECTS[nextIndex].id}`);
  }, [currentProjectIndex, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevProject();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextProject();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevProject, goToNextProject, navigate]);

  if (!currentProject) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="glass-panel border-none rounded-lg p-6 max-w-lg w-full mx-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link to="/projects" className="text-primary hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const renderProjectGame = () => {
    switch (currentProject.id) {
      case 'apollo':
        return <FarmingGame />;
      case 'universal-estimator':
        return <EstimatorGame />;
      case 'nosql':
        return <SqlGame />;
      case 'dspy':
        return <SpotlightGame />;
      case 'childrens':
        return <StorybookGame />;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚧</div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                GAME COMING SOON
              </h2>
              <p className="text-slate-400 max-w-md" style={{ fontFamily: 'monospace' }}>
                {currentProject.description}
              </p>
              {currentProject.link && (
                <a
                  href={currentProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  style={{ fontFamily: 'monospace' }}
                >
                  Visit Project →
                </a>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      <div className="relative w-full h-full">
        {/* Close button */}
        <Link
          to="/"
          className="absolute top-4 right-4 z-30 bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 rounded-lg p-2 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </Link>

        {/* Current project game */}
        {renderProjectGame()}

        {/* Project navigation - left side */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            onClick={goToPrevProject}
            className="bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white transition-colors"
            style={{ fontFamily: 'monospace' }}
            title="Previous project"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextProject}
            className="bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white transition-colors"
            style={{ fontFamily: 'monospace' }}
            title="Next project"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Current project indicator */}
        <div
          className="absolute top-4 right-16 z-20 bg-slate-900/95 border-2 border-slate-600 rounded-lg p-4 max-w-xs"
          style={{ fontFamily: 'monospace' }}
        >
          <div className="text-xs text-slate-500 mb-1">
            PROJECT {currentProjectIndex + 1} OF {PROJECTS.length}
          </div>
          <h3 className={`font-bold text-lg ${currentProject.role ? 'mb-1' : 'mb-2'} ${currentProject.id === 'apollo' ? 'text-green-400' : 'text-white'}`}>
            {currentProject.link ? (
              <a
                href={currentProject.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors inline-flex items-center gap-1"
              >
                {currentProject.name}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              currentProject.name
            )}
          </h3>
          {currentProject.role && (
            <p className="text-xs text-slate-500 mb-2">{currentProject.role}</p>
          )}
          <p className="text-sm text-slate-400">
            {currentProject.description}
          </p>
          <div className="mt-3 text-xs text-slate-600">
            Use arrows to browse • Esc to close
          </div>
        </div>

        {/* Project dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {PROJECTS.map((project, index) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentProjectIndex
                  ? 'bg-green-500'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              title={project.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Project;
