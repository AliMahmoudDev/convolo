/**
 * ConfirmSignOutDialog — A reusable confirmation dialog for signing out.
 *
 * WHY: Signing out is a destructive action. If the user accidentally
 * clicks "Sign Out" (especially on mobile where buttons are close together),
 * they'd lose their session and have to log in again. A confirmation
 * dialog prevents accidental sign-outs.
 *
 * HOW IT WORKS:
 * - Uses Radix UI's AlertDialog (accessible, focus-trapped, keyboard-friendly)
 * - Shows a warning message explaining what will happen
 * - "Cancel" (safe, default) and "Sign Out" (destructive, red) buttons
 * - On confirm: calls the onConfirm callback, then closes
 * - On cancel: just closes, nothing happens
 *
 * DESIGN DECISION: The destructive button is red and on the right.
 * The safe button is on the left (or top on mobile). This follows
 * the convention that "dangerous" actions are visually distinct and
 * require more effort to reach.
 */

"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmSignOutDialogProps {
  /** The element that triggers the dialog (usually a button) */
  children: React.ReactNode;
  /** Called when the user confirms sign out */
  onConfirm: () => Promise<void>;
}

export function ConfirmSignOutDialog({ children, onConfirm }: ConfirmSignOutDialogProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setIsSigningOut(true);
    try {
      await onConfirm();
    } finally {
      setIsSigningOut(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="border-[var(--border-default)] bg-[var(--bg-surface)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[var(--text-primary)]">Sign Out?</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--text-muted)]">
            You&apos;ll need to log in again to access your conversations and progress. Are you sure
            you want to sign out?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSigningOut}
            className="bg-[var(--state-error)] text-white hover:bg-[var(--state-error)]/90"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
