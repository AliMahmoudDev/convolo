/**
 * ConfirmSignOutDialog — A reusable confirmation dialog for signing out.
 *
 * WHY: Signing out is a destructive action. If the user accidentally
 * clicks "Sign Out" (especially on mobile where buttons are close together),
 * they'd lose their session and have to log in again. A confirmation
 * dialog prevents accidental sign-outs.
 *
 * TWO MODES OF USE:
 *
 * 1. CONTROLLED (external state) — for dropdowns/menus where the dialog
 *    must live OUTSIDE the menu to avoid getting unmounted:
 *    ```tsx
 *    const [dialogOpen, setDialogOpen] = useState(false);
 *    <button onClick={() => setDialogOpen(true)}>Sign Out</button>
 *    <ConfirmSignOutDialog
 *      open={dialogOpen}
 *      onOpenChange={setDialogOpen}
 *      onConfirm={handleSignOut}
 *    />
 *    ```
 *
 * 2. TRIGGER (self-contained) — for standalone buttons not inside menus:
 *    ```tsx
 *    <ConfirmSignOutDialog onConfirm={handleSignOut}>
 *      <button>Sign Out</button>
 *    </ConfirmSignOutDialog>
 *    ```
 *
 * CRITICAL: If the dialog is inside a dropdown/menu, use MODE 1.
 * If the dropdown closes, everything inside it unmounts — including
 * the dialog. This is why the dialog must be OUTSIDE the dropdown.
 */

"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
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
  /** Called when the user confirms sign out */
  onConfirm: () => Promise<void>;
  /** Controlled open state (use this when parent manages visibility) */
  open?: boolean;
  /** Called when the dialog should open/close (controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (only used in uncontrolled mode) */
  children?: React.ReactNode;
}

export function ConfirmSignOutDialog({
  onConfirm,
  open: controlledOpen,
  onOpenChange,
  children,
}: ConfirmSignOutDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const handleConfirm = async () => {
    setIsSigningOut(true);
    try {
      await onConfirm();
    } finally {
      setIsSigningOut(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only render trigger in uncontrolled mode */}
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
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
