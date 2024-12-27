import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-none">
        <DialogHeader>
          <DialogTitle className="font-beth-ellen text-2xl">About Me</DialogTitle>
          <DialogDescription className="text-lg">
            Hi, I'm Earl St Sauver. I'm passionate about building technology that makes a difference.
            Currently working on exciting projects at Apollo Agriculture, where we're leveraging technology
            to empower farmers across Africa.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;