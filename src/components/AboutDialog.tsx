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
        <DialogHeader className="space-y-4">
          <DialogTitle className="font-beth-ellen text-2xl">About Me</DialogTitle>
          <DialogDescription className="space-y-4 text-lg">
            <p>
              Hi, I'm Earl St Sauver, enthusiastic geek and reluctant executive.
            </p>
            
            <p>
              I'm a deep believer that humanities greatest leverage lies where others won't tread. 
              I've always liked problems that feel impossible, but am trying to reform myself now that I have children.
            </p>

            <p>
              I started Apollo Agriculture with Eli and Ben to bring modern farming to everyone. 
              I wanted to clear the bottom level of Maslow's hierarchy of needs in our lifetime, for everyone.
            </p>
            
            <p>
              What's the point of building aligned AIs if humans are not worth saving?
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;