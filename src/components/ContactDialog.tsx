import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Twitter, Linkedin, Mail } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactDialog = ({ open, onOpenChange }: ContactDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-none">
        <DialogHeader>
          <DialogTitle className="font-beth-ellen text-2xl">Contact</DialogTitle>
          <DialogDescription className="space-y-6">
            <p className="text-lg">
              Feel free to reach out to me on social media:
            </p>
            <div className="space-y-4">
              <a 
                href="https://twitter.com/estsauver" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
                @estsauver
              </a>
              <a 
                href="https://www.linkedin.com/in/estsauver/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn Profile
              </a>
              <div className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                My email is my twitter handle at gmail dot com
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;