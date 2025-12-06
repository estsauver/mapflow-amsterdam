import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectsDialog = ({ open, onOpenChange }: ProjectsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-none">
        <DialogHeader>
          <DialogTitle className="font-beth-ellen text-2xl">Projects</DialogTitle>
          <DialogDescription className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <a href="https://engineeringmanagertools.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    Engineering Manager Tools
                  </a>
                </h3>
                <p className="text-lg">
                  I want to let every engineering manager execute at a Tech Lead level.
                  Automated tooling to import all engineering work (code, reviews, debugging),
                  communication, and planning and automate the mechanical parts of management
                  (external communications, performance tracking, status updates.)
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <a href="https://nocommasql.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    No, SQL
                  </a>
                </h3>
                <p className="text-lg">
                  Examples and patterns showing how to accomplish common tasks in SQL that are often mistakenly thought to require NoSQL solutions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <a href="https://github.com/estsauver/dspy-spotlight" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    dspy-spotlight
                  </a>
                </h3>
                <p className="text-lg">
                  LLM sanitization tooling for DSPy.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">(Stealth) Children's Book Publisher</h3>
                <p className="text-lg">
                  Publishing children's books using AI generated stories and images.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsDialog;