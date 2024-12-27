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
          <DialogDescription className="text-lg">
            Here are some of my recent projects that showcase my expertise in web development
            and technology solutions for agricultural innovation.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsDialog;