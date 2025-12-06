import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FarmingGame from './FarmingGame';

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectsDialog = ({ open, onOpenChange }: ProjectsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-700 max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full">
          <FarmingGame />

          {/* Projects overlay in upper right */}
          <div className="absolute top-4 right-16 z-20 glass-panel rounded-lg p-4 max-w-sm max-h-[70vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-beth-ellen text-xl">Projects</DialogTitle>
            </DialogHeader>
            <DialogDescription className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-1 text-green-400">Apollo Agriculture</h3>
                <p>
                  Providing smallholder farmers in Africa with access to credit, high-quality seeds,
                  fertilizer, and data-driven agronomic advice to increase their yields and income.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">
                  <a href="https://engineeringmanagertools.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    Engineering Manager Tools
                  </a>
                </h3>
                <p>
                  Automated tooling to let every engineering manager execute at a Tech Lead level.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">
                  <a href="https://nocommasql.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    No, SQL
                  </a>
                </h3>
                <p>
                  Examples showing how to accomplish tasks often mistakenly thought to require NoSQL.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">
                  <a href="https://github.com/estsauver/dspy-spotlight" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    dspy-spotlight
                  </a>
                </h3>
                <p>
                  LLM sanitization tooling for DSPy.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">(Stealth) Children's Book Publisher</h3>
                <p>
                  Publishing children's books using AI generated stories and images.
                </p>
              </div>
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsDialog;
