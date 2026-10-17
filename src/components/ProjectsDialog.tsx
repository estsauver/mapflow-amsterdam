import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useIsMobile } from '@/hooks/use-mobile';
import BlackHoleScene from './BlackHoleScene';
import ConsoleStage from '@/lib/console/ConsoleStage';
import { createTestPattern } from '@/lib/console/testPattern';
import { createFarmingGame } from '@/games/farming';
import { createEstimatorGame } from '@/games/estimator';
import { createSqlGame } from '@/games/sql';
import { createSpotlightGame } from '@/games/spotlight';
import { createStorybookGame } from '@/games/storybook';

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Project {
  id: string;
  name: string;
  role?: string;
  description: string;
  hasGame: boolean;
  link?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'apollo',
    name: 'Apollo Agriculture',
    role: 'Founder, CTO (2015-2023)',
    description: 'Providing smallholder farmers in Africa with access to credit, high-quality seeds, fertilizer, and data-driven agronomic advice.',
    hasGame: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    role: 'MTS (2026-present)',
    description: "I can't say much about what I'm working on here.",
    hasGame: true,
    link: 'https://www.anthropic.com',
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

const ProjectsDialog = ({ open, onOpenChange }: ProjectsDialogProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial index from URL or default to 0
  const getInitialIndex = () => {
    if (projectId) {
      const index = PROJECTS.findIndex(p => p.id === projectId);
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentProjectIndex, setCurrentProjectIndex] = useState(getInitialIndex);
  const currentProject = PROJECTS[currentProjectIndex];
  const isMobile = useIsMobile();

  // Sync state with URL when projectId changes
  useEffect(() => {
    if (projectId) {
      const index = PROJECTS.findIndex(p => p.id === projectId);
      if (index >= 0 && index !== currentProjectIndex) {
        setCurrentProjectIndex(index);
      }
    }
  }, [projectId]);

  // Update URL when project changes
  const updateUrl = useCallback((index: number) => {
    const project = PROJECTS[index];
    if (location.pathname.startsWith('/projects')) {
      navigate(`/projects/${project.id}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  const goToPrevProject = useCallback(() => {
    const newIndex = currentProjectIndex > 0 ? currentProjectIndex - 1 : PROJECTS.length - 1;
    setCurrentProjectIndex(newIndex);
    updateUrl(newIndex);
  }, [currentProjectIndex, updateUrl]);

  const goToNextProject = useCallback(() => {
    const newIndex = currentProjectIndex < PROJECTS.length - 1 ? currentProjectIndex + 1 : 0;
    setCurrentProjectIndex(newIndex);
    updateUrl(newIndex);
  }, [currentProjectIndex, updateUrl]);

  const goToProject = useCallback((index: number) => {
    setCurrentProjectIndex(index);
    updateUrl(index);
  }, [updateUrl]);

  // Update URL when dialog opens (if not already on a specific project)
  useEffect(() => {
    if (open && location.pathname === '/projects') {
      navigate(`/projects/${PROJECTS[currentProjectIndex].id}`, { replace: true });
    }
  }, [open, location.pathname, currentProjectIndex, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevProject();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevProject, goToNextProject]);

  // Development aids: /projects/<id>?t=12 starts the fidelity ramp 12 s in;
  // /projects/<id>?console=test shows the console test pattern instead of the game.
  const devParams = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const fidelityStartAt = Number(devParams?.get('t')) || 0;

  const renderProjectGame = () => {
    if (devParams?.get('console') === 'test') {
      return <ConsoleStage key="console-test" program={createTestPattern} startAt={fidelityStartAt} />;
    }
    switch (currentProject.id) {
      // Each game runs on the console stage, which renders it through the fidelity
      // ramp. The key restarts the ramp when the project changes. Caps keep the
      // text-heavy games legible and the light-themed storybook from blooming out.
      case 'apollo':
        return <ConsoleStage key="apollo" program={createFarmingGame} startAt={fidelityStartAt} />;
      case 'anthropic':
        return <BlackHoleScene />;
      case 'universal-estimator':
        return <ConsoleStage key="universal-estimator" program={createEstimatorGame} startAt={fidelityStartAt} limits={{ lighting: 0.5, aberration: 0.15 }} />;
      case 'nosql':
        return <ConsoleStage key="nosql" program={createSqlGame} startAt={fidelityStartAt} limits={{ lighting: 0.5, aberration: 0.15 }} />;
      case 'dspy':
        return <ConsoleStage key="dspy" program={createSpotlightGame} startAt={fidelityStartAt} limits={{ lighting: 0.45, aberration: 0.12 }} />;
      case 'childrens':
        return <ConsoleStage key="childrens" program={createStorybookGame} startAt={fidelityStartAt} limits={{ bloom: 0.2, vignette: 0.2, lighting: 0.5 }} />;
      default:
        // Entries with hasGame but no game yet get a placeholder; entries without a game get a plain info panel.
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="text-center space-y-4 px-6">
              {currentProject.hasGame ? (
                <>
                  <div className="text-6xl">🚧</div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    GAME COMING SOON
                  </h2>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    {currentProject.name}
                  </h2>
                  {currentProject.role && (
                    <p className="text-sm text-slate-500" style={{ fontFamily: 'monospace' }}>
                      {currentProject.role}
                    </p>
                  )}
                </>
              )}
              <p className="text-slate-400 max-w-md mx-auto" style={{ fontFamily: 'monospace' }}>
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

  const renderMobileView = () => (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header message */}
        <div className="text-center pb-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
            My Projects
          </h2>
          <p className="text-sm text-slate-400" style={{ fontFamily: 'monospace' }}>
            This site is best experienced on desktop, where I've made it look real pretty, but here's basically the same info without the flair.
          </p>
        </div>

        {/* Project cards */}
        <div className="space-y-4">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              style={{ fontFamily: 'monospace' }}
            >
              <h3 className={`font-bold text-lg ${project.id === 'apollo' ? 'text-green-400' : 'text-white'}`}>
                {project.name}
              </h3>
              {project.role && (
                <p className="text-xs text-slate-500 mt-1">{project.role}</p>
              )}
              <p className="text-sm text-slate-400 mt-2">
                {project.description}
              </p>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Visit Project →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-slate-950 border-slate-700 p-0 overflow-hidden ${isMobile ? 'max-w-[95vw] w-[95vw] h-[85vh]' : 'max-w-[95vw] w-[95vw] h-[90vh]'}`}>
        {isMobile ? (
          renderMobileView()
        ) : (
          <div className="relative w-full h-full">
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
                ▲
              </button>
              <button
                onClick={goToNextProject}
                className="bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 rounded-lg p-3 text-white transition-colors"
                style={{ fontFamily: 'monospace' }}
                title="Next project"
              >
                ▼
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
                  <a href={currentProject.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                    {currentProject.name}
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
                Use ▲▼ or arrow keys to browse
              </div>
            </div>

            {/* Project dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {PROJECTS.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => goToProject(index)}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsDialog;
