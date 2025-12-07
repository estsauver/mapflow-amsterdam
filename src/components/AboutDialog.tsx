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
              I'm Earl St Sauver. I build things that matter with people I admire.
            </p>

            <p>
              I co-founded Apollo Agriculture because I believe everyone deserves access to
              the tools that help farmers thrive. With Eli and Ben, we set out to make
              modern agriculture accessible to smallholder farmers across Africa.
            </p>

            <p>
              I'm drawn to problems at the edges—the ones that seem impossible until someone
              actually tries. Though these days, with kids in the picture, I'm learning that
              some of the best problems to solve are closer to home.
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