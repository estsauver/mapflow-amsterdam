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
                <h3 className="text-xl font-semibold mb-2">EMTools</h3>
                <p className="text-lg">
                  I want to let every engineering manager execute at a Tech Lead level. 
                  Automated tooling to import all engineering work (code, reviews, debugging), 
                  communication, and planning and automate the mechanical parts of management 
                  (external communications, performance tracking, status updates.)
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Infinite Story Time</h3>
                <p className="text-lg">
                  Interactive indefinite stories using consist characters, prompted by children.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">PanChannel</h3>
                <p className="text-lg">
                  Convert one form of marketing material to another channel. Inspired by pandoc.
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