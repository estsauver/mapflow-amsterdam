import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DuBoisColorBar from './DuBoisColorBar';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dubois-panel p-0 border-2 border-dubois-ink overflow-hidden">
        <DuBoisColorBar />

        <DialogHeader className="space-y-4 p-6">
          <DialogTitle className="dubois-title text-2xl text-dubois-ink">About Me</DialogTitle>
          <DialogDescription className="space-y-4 text-base text-dubois-charcoal">
            <img
              src="/earl.jpeg"
              alt="Earl St Sauver"
              className="w-32 h-32 object-cover mx-auto mb-4 border-2 border-dubois-ink"
            />
            <p className="text-dubois-ink">
              I'm Earl St Sauver. I build things that matter with people I admire.
            </p>

            <p>
              I co-founded Apollo Agriculture because I believe everyone deserves access to
              the tools that help farmers thrive. With Eli and Ben, we set out to make
              modern agriculture accessible to smallholder farmers across Africa.
            </p>

            <p>
              While I'm drawn to barely possible problems, I'm now a Dad with two
              children, so I am trying to learn that I have limits.
            </p>

            <p>
              When I'm not working, I'm hopefully enjoying a nice bike ride or spending
              time in the outdoors.
            </p>

          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;