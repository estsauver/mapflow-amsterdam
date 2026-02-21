import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DuBoisColorBar from './DuBoisColorBar';

interface ResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResearchItem {
  title: string;
  description: string;
  internal?: string;
  external?: string;
  meta?: string;
}

const RESEARCH: ResearchItem[] = [
  {
    title: 'Think First, Diffuse Fast',
    meta: 'February 2026',
    description: 'Diffusion language models are 10x faster than autoregressive models but struggle with reasoning. A short planning prefix from a frontier model closes the gap — no training required. +11.6pp on GSM8K, +12.8pp on HumanEval for LLaDA-8B.',
    internal: '/blog/think-first-diffuse-fast',
  },
  {
    title: 'The Hidden Energy Subsidy: Orbital Solar Datacenters',
    description: 'Analyzing the full terrestrial energy cost of manufacturing and launching space-based solar panels to power orbital AI datacenters, as proposed by Elon Musk.',
    external: 'https://rockets.estsauver.com',
  },
];

const ResearchDialog = ({ open, onOpenChange }: ResearchDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dubois-cream border-0 p-0 overflow-hidden max-w-lg w-full">
        <div className="dubois-panel overflow-hidden">
          <DuBoisColorBar />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="dubois-title text-2xl text-dubois-ink">
                Research
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {RESEARCH.map((item) => (
                <div key={item.title} className="border-l-4 border-dubois-carmine pl-4">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="dubois-title text-base text-dubois-ink">
                      {item.internal ? (
                        <Link
                          to={item.internal}
                          className="hover:text-dubois-carmine transition-colors"
                          onClick={() => onOpenChange(false)}
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <a
                          href={item.external}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-dubois-carmine transition-colors"
                        >
                          {item.title}
                        </a>
                      )}
                    </h3>
                    {item.meta && (
                      <span className="text-xs text-dubois-ink/50 font-mono">{item.meta}</span>
                    )}
                  </div>
                  <p className="text-sm text-dubois-ink/70 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2">
                    {item.internal ? (
                      <Link
                        to={item.internal}
                        className="text-xs font-mono text-dubois-carmine hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        Read post →
                      </Link>
                    ) : (
                      <a
                        href={item.external}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-dubois-carmine hover:underline"
                      >
                        {item.external?.replace('https://', '')} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResearchDialog;
