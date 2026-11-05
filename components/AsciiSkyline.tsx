"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const COLS = 120;
const ROWS = 26;
const RAMP = " .:-=+*#%@";

const SKYLINE: string[] = [
  "                                                         -                            :                                 ",
  "                                                         +                            #-                                ",
  "                                                        .#                            %+                                ",
  "                                                       .#@*                          .@+                                ",
  "            .:                 :                      -%@@@*                         :@#                                ",
  "            **                 %-                    -@@@@@@%.                       +@@.                               ",
  "            **                 @-                   .%@@@@@@@%                       :@@                                ",
  "            #*                 @-     .             +@@@@@@@@@:                      =@@.                               ",
  "            #*                 @-    =@:           :#@@@@@@@@@=:                     #@@:  #-==+-:==-                   ",
  "            ##.*             + @-   .@@%          -#%@@@@@@@@@*%:              ..    %@@= .%#####*##=                   ",
  "            %%:#            .#.@=   -@@@.     .  :@@@@@@@@@@@@@@%  :          =%#%%: %@@- -@@@@@@@@@*  =       =        ",
  "            #%-#  +.     -: .#.@-   :@@%    - *:-%@@@@@@@@@@@@@@@# +- +      =@@@@@%.@@@=  @@@@@@@@@=  %-     .@.       ",
  "    ......  ##-# -@*    .@# .#.@+ .+%@@@*= :%:@%%@@@@@@@@@@@@@@@@@%%*-@.    -@@@@@@@%@@@=  @@@@@@@@@-  %*=====+@        ",
  "   :@@@@@@+ %@-# =@@####%@% .#-@* #@@@@@@@+-@:@@@@@@@@@@@%@@@@@@@@@@*-@.  .:%@@@@@@@@@@@* -@@@@@@@@@*  @@@@@@@@@        ",
  "  .%@@@@@@%-@@-% +@@@@@@@@@ .#.@+ @@@@@@@@#-@.@#@@%%@@@%: +@@@@*%@%%*-@. =%@@@@@@@@@@@@@@:=@@@@@@@@@#  @@@@@@@@@:.....  ",
  " .*@@@@@@@@%%@#@*%@@@@@@@@@**%*@#@@@@@@@@@#-@.% *% .@@%.   +@@* :@-:*-@##@@@@@@@@@@@@@@@@=+@@@@@@@@@@@@@@@@@@@@@@@@@@+  ",
  "  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-@:# ** .@@*    .@@+ .@-.*=@@@@@@@@@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@@@@@@@@@+  ",
  "  @@@%::#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+@=%.**.-@@*    .@@*.:@=-*-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+  ",
  "  @@@*  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%@=@*@@#%@@*    .@@@%%@%#*-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#@@@@@@@@@+  ",
  "  @@@=  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-% *%  @@*    .@@% :@=:*=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%: .%@@@@@@@+  ",
  "  @@@-  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-# **  @@*    .@@+ .@-.*=@@%+#@@@@#=+#@@@@%%@@@@@@@@@@@@@@@@=   =@@@@@@@+  ",
  "  @@@=  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+#.**..@@#:.::=@@#-=@=-#*@#---%@@+:  :*@@*..-%@@@@@@@@%#@@@@     @@@@#@@+  ",
  "  @@@-  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@# .@@@@@@@@@@@@@@@@@+ %@@@     @@@@ +@+  ",
  "  @@@-  -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@# .@@@@@@@@@@@@@@@@@= #@@@     @@@@ -@*  ",
  "##@@@%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%##@@@@@@@@@@@@@@@@@%#%@@@#####@@@@#%@@##",
  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
];

type Particle = {
  col: number;
  row: number;
  char: string;
  density: number;
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export default function AsciiSkyline({ className, ...props }: ComponentProps<"div">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -1000, y: -1000, active: false };
    let rafId = 0;
    let running = false;
    let visible = true;
    let cssW = 0;
    let cssH = 0;
    let fontSize = 10;
    let particles: Particle[] = [];

    // build initial particle list from grid
    const baseParticles: { col: number; row: number; char: string; density: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      const line = SKYLINE[r] || "";
      for (let c = 0; c < COLS; c++) {
        const ch = line[c] || " ";
        if (ch === " ") continue;
        const d = RAMP.indexOf(ch) / (RAMP.length - 1);
        baseParticles.push({ col: c, row: r, char: ch, density: Math.max(0.1, d) });
      }
    }

    const layout = () => {
      if (cssW <= 0 || cssH <= 0) return;
      const targetH = Math.min(cssH, cssW / 4.4);
      const cw = cssW / COLS;
      const ch = targetH / ROWS;
      fontSize = Math.max(7, Math.min(cw * 1.55, ch * 0.95));
      const offsetY = cssH - targetH;

      if (particles.length === 0) {
        particles = baseParticles.map((b) => {
          const hx = b.col * cw + cw / 2;
          const hy = offsetY + b.row * ch + ch / 2;
          return { ...b, hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
        });
      } else {
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          pt.hx = pt.col * cw + cw / 2;
          pt.hy = offsetY + pt.row * ch + ch / 2;
          if (!running) {
            pt.x = pt.hx;
            pt.y = pt.hy;
            pt.vx = 0;
            pt.vy = 0;
          }
        }
      }
    };

    const draw = (interactive: boolean) => {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const isDark = document.documentElement.classList.contains("dark");
      const radius = Math.max(90, Math.min(160, cssW * 0.15));
      let moving = false;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        if (interactive && pointer.active) {
          const dx = pointer.x - pt.x;
          const dy = pointer.y - pt.y;
          const dist = Math.hypot(dx, dy);

          if (dist < radius && dist > 1) {
            const t = 1 - dist / radius;
            const pull = t * t * 3.4;
            pt.vx += (dx / dist) * pull;
            pt.vy += (dy / dist) * pull;

            if (dist < 16) {
              const push = (16 - dist) * 0.35;
              pt.vx -= (dx / dist) * push;
              pt.vy -= (dy / dist) * push;
            }
          }
        }

        if (interactive) {
          pt.vx += (pt.hx - pt.x) * 0.085;
          pt.vy += (pt.hy - pt.y) * 0.085;
          pt.vx *= 0.82;
          pt.vy *= 0.82;
          pt.x += pt.vx;
          pt.y += pt.vy;

          const disp = Math.hypot(pt.x - pt.hx, pt.y - pt.hy);
          if (Math.abs(pt.vx) > 0.03 || Math.abs(pt.vy) > 0.03 || disp > 0.25) {
            moving = true;
          }
        }

        const disp = Math.hypot(pt.x - pt.hx, pt.y - pt.hy);
        const magnetRatio = Math.min(1, disp / 24);
        const baseAlpha = 0.25 + pt.density * 0.5;
        const alpha = Math.min(1, baseAlpha * (1 - magnetRatio * 0.2) + magnetRatio * 0.65);

        if (isDark) {
          if (magnetRatio > 0.12) {
            ctx.fillStyle = `rgba(252, 76, 1, ${alpha.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(240, 240, 245, ${alpha.toFixed(3)})`;
          }
        } else {
          if (magnetRatio > 0.12) {
            ctx.fillStyle = `rgba(224, 67, 0, ${alpha.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(25, 25, 30, ${alpha.toFixed(3)})`;
          }
        }

        ctx.fillText(pt.char, pt.x, pt.y);
      }

      return moving;
    };

    const loop = () => {
      if (!visible || reduceMotion.matches) return;
      const active = draw(true);
      if (active || pointer.active) {
        rafId = requestAnimationFrame(loop);
      } else {
        running = false;
        draw(false);
      }
    };

    const wake = () => {
      if (reduceMotion.matches || !visible) return;
      if (!running) {
        running = true;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      cssW = rect.width;
      cssH = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
      draw(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      wake();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else cancelAnimationFrame(rafId);
    });
    intersectionObserver.observe(canvas);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    resize();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      className={cn("relative w-full overflow-hidden select-none touch-none", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}
