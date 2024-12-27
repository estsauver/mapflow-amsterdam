import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
          <DialogDescription className="text-lg">
            Feel free to reach out to me to discuss potential collaborations
            or if you have any questions about my work.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;