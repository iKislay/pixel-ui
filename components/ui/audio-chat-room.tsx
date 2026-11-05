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
  you?: AudioChatParticipant;
  mutedText?: string;
  liveText?: string;
  defaultMuted?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onMutedChange?: (muted: boolean) => void;
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

const BUTTON =
  "flex h-[50px] cursor-pointer items-center justify-center rounded-2xl text-[15px] font-medium outline-none transition-[background-color,color,opacity,scale] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

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

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

const MIC =
  "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3";
const MIC_OFF =
  "M2 2l20 20M18.89 13.23A7 7 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v3a3 3 0 0 0 5.12 2.12M12 19v3";
const PHONE_DOWN =
  "M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91M22 2 2 22";

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
  mutedText = "You're in. Your mic is muted.",
  liveText = "You're live. Everyone can hear you.",
  you = { id: "you", name: "You" },
  expanded: expandedProp,
  defaultExpanded = false,
  defaultMuted = true,
  onExpandedChange,
  onJoin,
  onLeave,
  onMutedChange,
  className,
  style,
  onClick,
  onKeyDown,
  ...props
}: AudioChatRoomProps) {
  const [inner, setInner] = useState(defaultExpanded);
  const expanded = expandedProp ?? inner;
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(defaultMuted);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const joinRef = useRef<HTMLButtonElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const focusOnOpen = useRef(false);
  const focusOnJoin = useRef(false);

  function setExpanded(next: boolean) {
    focusOnOpen.current = true;
    if (expandedProp === undefined) setInner(next);
    onExpandedChange?.(next);
  }

  function join() {
    focusOnJoin.current = true;
    setJoined(true);
    onJoin?.();
  }

  function leave() {
    focusOnJoin.current = true;
    setJoined(false);
    setMuted(defaultMuted);
    onLeave?.();
  }

  function toggleMute() {
    setMuted(!muted);
    onMutedChange?.(!muted);
  }

  useEffect(() => {
    if (!focusOnOpen.current) return;
    focusOnOpen.current = false;
    if (expanded) closeRef.current?.focus();
    else rootRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!focusOnJoin.current) return;
    focusOnJoin.current = false;
    if (joined) micRef.current?.focus();
    else joinRef.current?.focus();
  }, [joined]);

  // you always render at the end of the grid so joining and leaving can animate both ways
  const people = [...participants, { ...you, speaking: joined && !muted }];
  const count = participants.length + (joined ? 1 : 0);
  const rows = Math.max(1, Math.ceil(count / COLUMNS));
  const expandedHeight = GRID_Y + rows * ROW_HEIGHT + FOOTER;
  const extra = Math.max(0, count - MAX_STACK);
  const status = joined ? (muted ? mutedText : liveText) : helperText;

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
      data-joined={joined || undefined}
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
        {extra > 0 && <span className="text-base font-medium tabular-nums">+{extra}</span>}
        <Icon d="m6 9 6 6 6-6" className="h-4 w-4" />
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
          <Icon d="M18 6 6 18M6 6l12 12" className="h-5 w-5" />
        </button>
      </div>

      {people.map((p, i) => {
        const isYou = i === participants.length;
        const shown = !isYou || joined;
        const col = i % COLUMNS;
        const row = Math.floor(i / COLUMNS);
        const gx = GRID_X + col * COL_WIDTH;
        const gy = GRID_Y + row * ROW_HEIGHT;
        const stack = Math.min(i, MAX_STACK - 1);
        const x = expanded ? gx : COLLAPSED_X + stack * COLLAPSED_STEP;
        const y = expanded ? gy : (COLLAPSED_HEIGHT - AVATAR_COLLAPSED) / 2 - 1;
        const scale = (expanded ? 1 : COLLAPSED_SCALE) * (shown ? 1 : 0.6);
        const visible = shown && (expanded || i < MAX_STACK);
        const moveDelay = isYou
          ? expanded ? 60 : 0
          : expanded ? i * 30 : (people.length - 1 - i) * 20;
        const labelDelay = expanded ? (isYou ? 120 : 150 + i * 30) : 0;
        const speaking = expanded && shown && !!p.speaking;

        return (
          <Fragment key={p.id}>
            <div
              aria-hidden={!shown}
              className={cn(
                "absolute left-0 top-0 overflow-hidden rounded-full shadow-sm ring-[2.5px] ring-background",
                isYou && expanded ? "origin-center" : "origin-top-left",
                MOVE,
                DELAY,
                visible ? "opacity-100" : "opacity-0",
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
                speaking ? "opacity-100" : "opacity-0",
              )}
              style={{
                ...delay(expanded ? (isYou ? 0 : 200 + i * 30) : 0),
                zIndex: 2,
                transform: `translate3d(${gx + AVATAR + 4 - 26}px, ${gy - 4}px, 0) scale(${speaking ? 1 : 0})`,
              }}
            >
              <Bars className="bg-foreground" />
            </span>

            <span
              aria-hidden={!shown}
              className={cn(
                "pointer-events-none absolute left-0 top-0 truncate text-center text-[13px] font-medium",
                isYou ? "text-foreground" : "text-muted-foreground",
                MOVE,
                DELAY,
                expanded && shown ? "opacity-100" : "opacity-0",
              )}
              style={{
                ...delay(labelDelay),
                width: COL_WIDTH - 8,
                transform: `translate3d(${gx - (COL_WIDTH - 8 - AVATAR) / 2}px, ${expanded && shown ? gy + AVATAR + 8 : gy + AVATAR}px, 0)`,
              }}
            >
              {p.name}
              {speaking && <span className="sr-only"> (speaking)</span>}
            </span>
          </Fragment>
        );
      })}

      <div
        className={cn(
          "absolute inset-x-4 bottom-[50px]",
          "transition-[translate,opacity] duration-500",
          EASE,
          DELAY,
          "motion-reduce:transition-opacity motion-reduce:duration-150",
          expanded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        style={delay(expanded ? 200 : 0)}
      >
        <button
          ref={joinRef}
          type="button"
          inert={!expanded || joined}
          onClick={(e) => {
            e.stopPropagation();
            join();
          }}
          className={cn(
            BUTTON,
            "absolute inset-0 w-full bg-foreground text-background shadow-lg shadow-foreground/20 hover:opacity-90",
            "transition-[translate,scale,opacity] duration-300",
            EASE,
            joined && "pointer-events-none -translate-y-2 scale-95 opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100",
          )}
        >
          {joinLabel}
        </button>

        <div
          inert={!expanded || !joined}
          className={cn(
            "flex gap-2 transition-[translate,opacity] duration-300 motion-reduce:transition-opacity",
            EASE,
            joined ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 motion-reduce:translate-y-0",
          )}
        >
          <button
            ref={micRef}
            type="button"
            aria-label={muted ? "Unmute mic" : "Mute mic"}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className={cn(
              BUTTON,
              "relative w-[50px] shrink-0",
              muted ? "bg-muted text-foreground hover:bg-border" : "bg-foreground text-background hover:opacity-90",
            )}
          >
            {[MIC_OFF, MIC].map((d, i) => {
              const on = i === 1 ? !muted : muted;
              return (
                <span
                  key={d}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-[scale,opacity] duration-300 motion-reduce:transition-none",
                    EASE,
                    on ? "scale-100 opacity-100" : "scale-50 opacity-0",
                  )}
                >
                  <Icon d={d} className="h-5 w-5" />
                </span>
              );
            })}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              leave();
            }}
            className={cn(BUTTON, "flex-1 gap-2 bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:opacity-90")}
          >
            <Icon d={PHONE_DOWN} className="h-[18px] w-[18px]" />
            Leave
          </button>
        </div>
      </div>

      <div
        aria-live="polite"
        className={cn("absolute inset-x-0 bottom-4 h-5 text-[13px] text-muted-foreground", FADE, DELAY, expanded ? "opacity-100" : "opacity-0")}
        style={delay(expanded ? 250 : 0)}
      >
        {[helperText, mutedText, liveText].map((text, i) => (
          <p
            key={i}
            aria-hidden={text !== status}
            className={cn(
              "absolute inset-0 text-center transition-[opacity,translate] duration-300 motion-reduce:transition-opacity",
              EASE,
              text === status ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 motion-reduce:translate-y-0",
            )}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
