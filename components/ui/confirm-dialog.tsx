'use client';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** SweetAlert2-style confirmations — shadcn, no extra dependency */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';
  const Icon = isDestructive ? Trash2 : AlertTriangle;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[oklch(0.09_0.006_285)] sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div
            className={cn(
              'mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full',
              isDestructive ? 'bg-destructive/15 text-destructive' : 'bg-amber-500/15 text-amber-400',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <AlertDialogTitle className="text-base font-semibold text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel disabled={loading} className="border-white/10">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={loading}
            className={cn(!isDestructive && 'gradient-brand text-white border-0')}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
