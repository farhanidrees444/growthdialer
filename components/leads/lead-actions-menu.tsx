"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { useSiteTheme } from "@/components/theme/site-theme";
import { cn } from "@/lib/utils";

type MenuTone = "default" | "success" | "danger";

export interface LeadActionItem {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  tone?: MenuTone;
  onSelect: () => void;
}

interface LeadActionsMenuProps {
  leadName: string;
  actions: LeadActionItem[];
  triggerClassName?: string;
}

const MENU_WIDTH = 232;
const VIEWPORT_GUTTER = 12;

function actionToneClasses(tone: MenuTone = "default", isDark: boolean) {
  if (tone === "success") {
    return isDark
      ? "text-emerald-300 hover:border-emerald-500/20 hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 [&_svg]:text-emerald-400"
      : "text-emerald-700 hover:border-emerald-600/25 hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 [&_svg]:text-emerald-700";
  }
  if (tone === "danger") {
    return isDark
      ? "text-red-300 hover:border-red-500/20 hover:bg-red-500/10 focus-visible:bg-red-500/10 [&_svg]:text-red-400"
      : "text-red-600 hover:border-red-600/25 hover:bg-red-500/10 focus-visible:bg-red-500/10 [&_svg]:text-red-600";
  }
  return isDark
    ? "text-slate-300 hover:border-white/[0.08] hover:bg-white/[0.05] focus-visible:bg-white/[0.06] [&_svg]:text-slate-500"
    : "text-zinc-700 hover:border-zinc-950/10 hover:bg-zinc-950/[0.04] focus-visible:bg-zinc-950/[0.05] [&_svg]:text-zinc-500";
}

export function LeadActionsMenu({
  leadName,
  actions,
  triggerClassName,
}: LeadActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: MENU_WIDTH,
    originY: -6,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { isDark } = useSiteTheme();

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const estimatedHeight = 76 + actions.length * 48;
      const width = Math.min(MENU_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
      const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER);
      const left = Math.min(
        Math.max(VIEWPORT_GUTTER, rect.right - width),
        maxLeft,
      );
      const opensUp = rect.bottom + estimatedHeight + VIEWPORT_GUTTER > window.innerHeight;

      setCoords({
        left,
        width,
        top: opensUp
          ? Math.max(VIEWPORT_GUTTER, rect.top - estimatedHeight - 8)
          : rect.bottom + 8,
        originY: opensUp ? 6 : -6,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [actions.length, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Open actions for ${leadName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400 shadow-sm transition",
          isDark
            ? "hover:border-emerald-500/25 hover:bg-emerald-500/10 hover:text-white"
            : "hover:border-emerald-600/30 hover:bg-emerald-500/10 hover:text-emerald-700",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40",
          triggerClassName,
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-[90]"
                  aria-hidden
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  role="menu"
                  aria-label={`Actions for ${leadName}`}
                  initial={{ opacity: 0, y: coords.originY, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: coords.originY, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  style={{
                    position: "fixed",
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                  }}
                  className={cn(
                    "z-[100] overflow-hidden rounded-2xl border backdrop-blur-xl",
                    isDark
                      ? "border-white/[0.12] bg-[oklch(0.09_0.006_285)]/98 shadow-2xl shadow-black/60"
                      : "border-zinc-950/[0.08] bg-white/98 shadow-[0_24px_60px_rgba(76,29,149,0.14),0_2px_8px_rgba(9,9,11,0.06)]",
                  )}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-b border-white/[0.07] px-4 py-3">
                    <p className={cn('truncate text-sm font-semibold', isDark ? 'text-white' : 'text-zinc-950')}>{leadName}</p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                      Lead actions
                    </p>
                  </div>
                  <div className="p-1.5">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        role="menuitem"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpen(false);
                          action.onSelect();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/35",
                          actionToneClasses(action.tone, isDark),
                        )}
                      >
                        <span className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isDark ? 'bg-white/[0.04]' : 'bg-zinc-950/[0.04]',
                        )}>
                          {action.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{action.label}</span>
                          {action.description && (
                            <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                              {action.description}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
