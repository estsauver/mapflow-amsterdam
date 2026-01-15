import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Twitter, Linkedin, Mail } from "lucide-react";
import DuBoisColorBar from './DuBoisColorBar';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactDialog = ({ open, onOpenChange }: ContactDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dubois-panel p-0 border-2 border-dubois-ink overflow-hidden">
        <DuBoisColorBar />

        <DialogHeader className="p-6">
          <DialogTitle className="dubois-title text-2xl text-dubois-ink">Contact</DialogTitle>
          <DialogDescription className="space-y-6 text-dubois-charcoal">
            <p className="text-base">
              Feel free to reach out to me on social media:
            </p>
            <div className="space-y-3">
              <a
                href="https://twitter.com/estsauver"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-base text-dubois-ink hover:text-dubois-carmine transition-colors border-2 border-dubois-ink p-3 bg-dubois-warm-white hover:bg-dubois-parchment"
              >
                <Twitter className="h-5 w-5" />
                <span className="dubois-heading">@estsauver</span>
              </a>
              <a
                href="https://www.linkedin.com/in/estsauver/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-base text-dubois-ink hover:text-dubois-prussian transition-colors border-2 border-dubois-ink p-3 bg-dubois-warm-white hover:bg-dubois-parchment"
              >
                <Linkedin className="h-5 w-5" />
                <span className="dubois-heading">LinkedIn Profile</span>
              </a>
              <div className="flex items-center gap-3 text-base text-dubois-ink border-2 border-dubois-ink p-3 bg-dubois-warm-white">
                <Mail className="h-5 w-5" />
                <span>My email is my twitter handle at gmail dot com</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;