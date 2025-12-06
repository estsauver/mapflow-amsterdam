import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FarmingGame from './FarmingGame';

interface FarmingGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FarmingGameDialog = ({ open, onOpenChange }: FarmingGameDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 border-slate-700 p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 bg-slate-900/50">
          <DialogTitle className="text-green-400 font-mono tracking-wider text-lg">
            APOLLO FARMER: SEEDS OF PROSPERITY
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-mono text-sm">
            A story of agricultural credit transforming smallholder farming in Kenya
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <FarmingGame />
        </div>
        <div className="p-4 pt-0 space-y-2">
          <p className="text-slate-500 text-xs font-mono text-center">
            Based on the real impact of Apollo Agriculture's credit program for farmers in Kenya.
          </p>
          <p className="text-slate-600 text-xs font-mono text-center">
            Click the game screen or wait for auto-advance to continue the story.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FarmingGameDialog;
