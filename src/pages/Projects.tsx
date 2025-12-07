import React from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';

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

const Projects = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="glass-panel border-none rounded-lg p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <Link
          to="/"
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Link>

        <div className="space-y-6">
          <h1 className="font-beth-ellen text-2xl">Projects</h1>
          <div className="space-y-4">
            {PROJECTS.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {project.role && (
                      <p className="text-sm text-muted-foreground mt-1">{project.role}</p>
                    )}
                    <p className="text-muted-foreground mt-2">{project.description}</p>
                  </div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="shrink-0 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
