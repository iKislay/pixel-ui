"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

export type AudioChatParticipant = {
  id: string;
  name: string;
  avatar?: string;
  speaking?: boolean;
};

export type AudioChatRoomProps = Omit<ComponentProps<"div">, "title"> & {
  participants: AudioChatParticipant[];
  title?: string;
  joinLabel?: string;
  helperText?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onJoin?: () => void;
};

function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const COLLAPSED_WIDTH = 268;
const COLLAPSED_HEIGHT = 60;
const EXPANDED_WIDTH = 360;
const COLLAPSED_RADIUS = COLLAPSED_HEIGHT / 2;
const EXPANDED_RADIUS = 24;

const AVATAR = 56;
const AVATAR_COLLAPSED = 44;
const COLLAPSED_SCALE = AVATAR_COLLAPSED / AVATAR;
const COLLAPSED_X = 60;
const COLLAPSED_STEP = 32;
const MAX_STACK = 4;

const COLUMNS = 4;
const COL_WIDTH = 80;
const ROW_HEIGHT = 95;
const GRID_Y = 70;
const GRID_X = (EXPANDED_WIDTH - ((COLUMNS - 1) * COL_WIDTH + AVATAR)) / 2;
const FOOTER = 160;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const MOVE = `transition-[transform,translate,scale,opacity] duration-500 ${EASE} motion-reduce:transition-opacity motion-reduce:duration-150`;
const FADE = `transition-opacity duration-300 ${EASE} motion-reduce:duration-150`;
const DELAY = "[transition-delay:var(--d)] motion-reduce:[transition-delay:0ms]";

const STATIC_BARS = [0.5, 1, 0.72];

function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function Bars({ className }: { className: string }) {
  return (
    <span className="flex h-3.5 items-center justify-center gap-[2px]" aria-hidden>
      {STATIC_BARS.map((scale, i) => (
        <span
          key={i}
          className={cn(
            "h-3.5 w-[3px] origin-center rounded-full motion-reduce:animate-none",
            "animate-[voice-bar_0.5s_ease-in-out_infinite]",
            className,
          )}
          style={{ transform: `scaleY(${scale})`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </span>
  );
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

function Avatar({ participant }: { participant: AudioChatParticipant }) {
  const [failed, setFailed] = useState(false);

  if (!participant.avatar || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-muted text-sm font-semibold text-muted-foreground">
        {initials(participant.name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={participant.avatar}
      alt={participant.name}
      draggable={false}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

export function AudioChatRoom({
  participants,
  title = "Voice chat",
  joinLabel = "Join now",
  helperText = "Mic will be muted initially.",
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  onJoin,
  className,
  style,
  onClick,
  onKeyDown,
  ...props
}: AudioChatRoomProps) {
  const [inner, setInner] = useState(defaultExpanded);
  const expanded = expandedProp ?? inner;
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  function setExpanded(next: boolean) {
    moveFocus.current = true;
    if (expandedProp === undefined) setInner(next);
    onExpandedChange?.(next);
  }

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (expanded) closeRef.current?.focus();
    else rootRef.current?.focus();
  }, [expanded]);

  const count = participants.length;
  const rows = Math.max(1, Math.ceil(count / COLUMNS));
  const expandedHeight = GRID_Y + rows * ROW_HEIGHT + FOOTER;
  const extra = Math.max(0, count - MAX_STACK);

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    onClick?.(e);
    if (!expanded && !e.defaultPrevented) setExpanded(true);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (!expanded && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setExpanded(true);
    } else if (expanded && e.key === "Escape") {
      setExpanded(false);
    }
  }

  return (
    <div
      ref={rootRef}
      data-slot="audio-chat-room"
      data-state={expanded ? "expanded" : "collapsed"}
      role={expanded ? "group" : "button"}
      tabIndex={expanded ? -1 : 0}
      aria-expanded={expanded}
      aria-label={expanded ? title : `${title}, ${count} participants`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative overflow-hidden border border-border bg-background text-foreground outline-none",
        "transition-[width,height,border-radius,box-shadow,transform,scale] duration-500",
        EASE,
        "motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        expanded
          ? "shadow-2xl"
          : "cursor-pointer shadow-xl hover:shadow-2xl active:scale-[0.98] motion-reduce:active:scale-100",
        className,
      )}
      style={{
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        height: expanded ? expandedHeight : COLLAPSED_HEIGHT,
        borderRadius: expanded ? EXPANDED_RADIUS : COLLAPSED_RADIUS,
        ...style,
      }}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          "absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-foreground",
          "transition-[transform,translate,scale,opacity] duration-500",
          EASE,
          "motion-reduce:transition-opacity motion-reduce:duration-150",
          expanded ? "scale-50 opacity-0" : "scale-100 opacity-100",
        )}
      >
        <Bars className="bg-background" />
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-muted-foreground",
          FADE,
          expanded ? "opacity-0" : "opacity-100",
        )}
      >
        {extra > 0 && <span className="text-base font-medium">+{extra}</span>}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <div
        inert={!expanded}
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-between px-5 pb-3 pt-4",
          FADE,
          DELAY,
          expanded ? "opacity-100" : "opacity-0",
        )}
        style={delay(expanded ? 100 : 0)}
      >
        <div className="w-8" />
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        aria-hidden
        className={cn("absolute left-4 right-4 top-[52px] h-px bg-border", FADE, DELAY, expanded ? "opacity-100" : "opacity-0")}
        style={delay(expanded ? 150 : 0)}
      />

      {participants.map((p, i) => {
        const col = i % COLUMNS;
        const row = Math.floor(i / COLUMNS);
        const gx = GRID_X + col * COL_WIDTH;
        const gy = GRID_Y + row * ROW_HEIGHT;
        const stack = Math.min(i, MAX_STACK - 1);
        const x = expanded ? gx : COLLAPSED_X + stack * COLLAPSED_STEP;
        const y = expanded ? gy : (COLLAPSED_HEIGHT - AVATAR_COLLAPSED) / 2 - 1;
        const scale = expanded ? 1 : COLLAPSED_SCALE;
        const moveDelay = expanded ? i * 30 : (count - 1 - i) * 20;
        const labelDelay = expanded ? 150 + i * 30 : 0;

        return (
          <Fragment key={p.id}>
            <div
              className={cn(
                "absolute left-0 top-0 origin-top-left overflow-hidden rounded-full shadow-sm ring-[2.5px] ring-background",
                MOVE,
                DELAY,
                !expanded && i >= MAX_STACK && "opacity-0",
              )}
              style={{
                ...delay(moveDelay),
                width: AVATAR,
                height: AVATAR,
                zIndex: expanded ? 1 : MAX_STACK - stack,
                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
              }}
            >
              <Avatar participant={p} />
            </div>

            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-background shadow-md",
                MOVE,
                DELAY,
                expanded && p.speaking ? "opacity-100" : "opacity-0",
              )}
              style={{
                ...delay(expanded ? 200 + i * 30 : 0),
                zIndex: 2,
                transform: `translate3d(${gx + AVATAR + 4 - 26}px, ${gy - 4}px, 0) scale(${expanded && p.speaking ? 1 : 0})`,
              }}
            >
              <Bars className="bg-foreground" />
            </span>

            <span
              className={cn(
                "pointer-events-none absolute left-0 top-0 truncate text-center text-[13px] font-medium text-muted-foreground",
                MOVE,
                DELAY,
                expanded ? "opacity-100" : "opacity-0",
              )}
              style={{
                ...delay(labelDelay),
                width: COL_WIDTH - 8,
                transform: `translate3d(${gx - (COL_WIDTH - 8 - AVATAR) / 2}px, ${expanded ? gy + AVATAR + 8 : gy + AVATAR}px, 0)`,
              }}
            >
              {p.name}
              {p.speaking && <span className="sr-only"> (speaking)</span>}
            </span>
          </Fragment>
        );
      })}

      <button
        type="button"
        inert={!expanded}
        onClick={(e) => {
          e.stopPropagation();
          onJoin?.();
        }}
        className={cn(
          "absolute inset-x-4 bottom-[50px] cursor-pointer rounded-2xl bg-foreground py-3.5 text-[15px] font-medium text-background shadow-lg shadow-foreground/20 outline-none",
          "transition-[transform,translate,scale,opacity] duration-500",
          EASE,
          DELAY,
          "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-reduce:transition-opacity motion-reduce:duration-150",
          expanded ? "translate-y-0 opacity-100 active:scale-[0.98] motion-reduce:active:scale-100" : "pointer-events-none translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        style={delay(expanded ? 200 : 0)}
      >
        {joinLabel}
      </button>

      <p
        className={cn("absolute inset-x-0 bottom-4 text-center text-[13px] text-muted-foreground", FADE, DELAY, expanded ? "opacity-100" : "opacity-0")}
        style={delay(expanded ? 250 : 0)}
        aria-hidden={!expanded}
      >
        {helperText}
      </p>
    </div>
  );
}
