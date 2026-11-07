import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { strings } from '@/shared/i18n/strings';
import { cn } from '@/shared/utils/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type SheetSide = 'bottom' | 'right';

export interface DialogContentProps extends Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  'title'
> {
  /** Required: every dialog needs an accessible name. */
  title: string;
  description?: string;
  /** Visually hide the title (it is still announced). */
  hideTitle?: boolean;
  footer?: ReactNode;
}

function Overlay() {
  return (
    <DialogPrimitive.Overlay className="data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
  );
}

interface HeaderProps {
  title: string;
  description: string | undefined;
  hideTitle: boolean | undefined;
}

function Header({ title, description, hideTitle }: HeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1 pr-10', hideTitle && 'sr-only')}>
      <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-text-muted text-sm">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      aria-label={strings.common.close}
      className="text-text-muted hover:bg-text/5 hover:text-text absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full transition-colors"
    >
      <X aria-hidden="true" className="size-5" />
    </DialogPrimitive.Close>
  );
}

/** Centered modal dialog (focus trapped, Esc closes, focus returns to the trigger). */
export function DialogContent({
  title,
  description,
  hideTitle,
  footer,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'border-border bg-surface-elevated shadow-elevation-3 fixed top-1/2 left-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl border p-6 focus:outline-none',
          'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
          className,
        )}
        {...props}
      >
        <Header title={title} description={description} hideTitle={hideTitle} />
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export interface SheetContentProps extends DialogContentProps {
  side?: SheetSide;
}

const SHEET_SIDES: Record<SheetSide, string> = {
  bottom:
    'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl border-t pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=open]:animate-sheet-bottom-in data-[state=closed]:animate-sheet-bottom-out',
  right:
    'inset-y-0 right-0 h-dvh w-full max-w-md border-l data-[state=open]:animate-sheet-right-in data-[state=closed]:animate-sheet-right-out',
};

/** Edge-anchored dialog: bottom sheet on mobile, side panel on desktop. Same a11y as Dialog. */
export function SheetContent({
  side = 'bottom',
  title,
  description,
  hideTitle,
  footer,
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'border-border bg-surface-elevated shadow-elevation-3 fixed z-50 flex flex-col gap-5 overflow-y-auto p-6 focus:outline-none',
          SHEET_SIDES[side],
          className,
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <div aria-hidden="true" className="bg-text/15 mx-auto -mt-2 h-1.5 w-10 rounded-full" />
        ) : null}
        <Header title={title} description={description} hideTitle={hideTitle} />
        {children}
        {footer ? <div className="mt-auto flex flex-wrap justify-end gap-2">{footer}</div> : null}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
