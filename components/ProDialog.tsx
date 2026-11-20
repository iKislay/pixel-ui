"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Tag from "@/components/Tag";
import { PRO_PRICE } from "@/lib/pro";
import { cn } from "@/lib/utils";

export default function ProDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (open && !el?.open) el?.showModal();
    if (!open && el?.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      data-slot="pro-dialog"
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(92vw,28rem)] overflow-visible bg-transparent p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div
        className={cn("flex flex-col gap-5 rounded-[36px] bg-card p-6 sm:rounded-[44px] sm:p-7", className)}
        style={{ cornerShape: "squircle" } as React.CSSProperties}
      >
        <div className="flex items-center justify-between">
          <Tag tone="pro" />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-balance font-serif text-3xl tracking-tight">{title}</h2>
          <p className="text-balance text-sm font-medium text-muted-foreground">{description}</p>
        </div>

        {children}

        <Link
          href="/pricing"
          className="btn-primary flex h-11 items-center justify-center rounded-full text-sm font-semibold text-white"
        >
          Get Pro for ${PRO_PRICE}
        </Link>
      </div>
    </dialog>
  );
}
