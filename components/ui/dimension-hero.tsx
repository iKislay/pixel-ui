"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LinearSRGBColorSpace,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import type { TextGeometry as TextGeometryType } from "three/addons/geometries/TextGeometry.js";
import { cn } from "@/lib/utils";

export type DimensionHeroProps = Omit<ComponentProps<"section">, "children"> & {
  headline?: string;
  tagline?: string;
};

const SHAPES = ["square", "circle", "circle", "square"];
const STAGGER = 0.12;
const FOV = 40;
const WORLD_H = 10;
const DIST = WORLD_H / 2 / Math.tan((FOV * Math.PI) / 360);
const TRACKING = -0.04;
const TILE_START = 1.1;
const TILE_TIME = 2;
const LIFT_IN = 1.6;
const LIFT_OUT = 1.3;

const CSS = `
.dh-root{container-type:size}
.dh-stage{transform:translateY(-12cqh);animation:dh-rise 1.9s cubic-bezier(.83,0,.17,1) 1.5s both}
@keyframes dh-rise{from{transform:translateY(calc((1.5rem + 1.25rem * 1.1) / 2))}}
.dh-head{font-size:clamp(40px,min(calc((100cqw - 3rem) / 6.5),24cqh),220px);font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:700}
.dh-root[data-lifted] .dh-head,.dh-root[data-lifted] .dh-tag{visibility:hidden}
.dh-word{display:inline-block;position:relative}
.dh-text{display:inline-block;-webkit-text-fill-color:transparent;animation:dh-text 1s step-end var(--d) forwards,dh-drift .25s ease-out calc(var(--d) + .55s) both}
.dh-word[data-side=left] .dh-text{transform-origin:left bottom}
.dh-word[data-side=right] .dh-text{transform-origin:right bottom}
.dh-text::before{content:"";position:absolute;width:.12em;height:.12em;bottom:.02em;background:currentColor;visibility:hidden;animation:dh-shape 1s step-end var(--d) both}
.dh-word[data-side=left] .dh-text::before{right:100%;transform-origin:right bottom}
.dh-word[data-side=right] .dh-text::before{left:calc(100% + .06em);transform-origin:left bottom}
.dh-word[data-shape=circle] .dh-text::before{border-radius:50%}
@keyframes dh-shape{0%{visibility:hidden;scale:1}.5%{visibility:visible;scale:1}15%{visibility:visible;scale:1.5}30%{visibility:visible;scale:2}45%{visibility:visible;scale:2}55%{visibility:hidden;scale:0}}
@keyframes dh-text{0%{-webkit-text-fill-color:transparent;transform:scale(.35)}15%{-webkit-text-fill-color:transparent;transform:scale(.35)}30%{-webkit-text-fill-color:currentcolor;transform:scale(.35)}45%{-webkit-text-fill-color:currentcolor;transform:scale(.65)}55%{-webkit-text-fill-color:currentcolor;transform:scale(1)}to{-webkit-text-fill-color:currentcolor;transform:scale(1)}}
@keyframes dh-drift{from{translate:calc(var(--dir) * .08em) 0}to{translate:0 0}}
.dh-tag{animation:dh-fade .8s cubic-bezier(.16,1,.3,1) 1.66s both}
.dh-pill{animation:dh-fade .8s cubic-bezier(.16,1,.3,1) 2s both}
@keyframes dh-fade{from{opacity:0;transform:translateY(8px)}}
.dh-capsule{rotate:-30deg;animation:dh-rock 3.2s ease-in-out infinite}
@keyframes dh-rock{50%{rotate:-12deg}}
@media (prefers-reduced-motion:reduce){.dh-stage,.dh-text,.dh-text::before,.dh-tag,.dh-pill,.dh-capsule{animation:none}.dh-text{-webkit-text-fill-color:currentcolor}}
`;

const NOISE = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
`;

const GRID_VERT = `
uniform float uTime,uStep,uZ1,uSpan,uNear,uFar;
varying float vA;
void main(){
  vec3 p=position;
  p.z+=mod(uTime*1.4,uStep);
  float scan=uZ1+mod(uTime*9.,uSpan+24.);
  float g=(p.z-scan)/1.4;
  float band=exp(-g*g);
  vec4 mv=modelViewMatrix*vec4(p,1.);
  vA=(.13+band*.7)*(1.-smoothstep(uNear,uFar,-mv.z));
  gl_Position=projectionMatrix*mv;
}`;

const STREAK_VERT = `
attribute float aSeed,aEnd;
uniform float uTime;
uniform vec3 uOrigin;
varying float vA;
void main(){
  float speed=4.+aSeed*9.;
  float r=5.+mod(aSeed*97.+uTime*speed,45.);
  vec3 p=uOrigin+position*(r+aEnd*(.8+speed*.35));
  vA=smoothstep(5.,12.,r)*(1.-smoothstep(30.,50.,r))*(.16+.24*aSeed)*(1.-aEnd*.8);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;

const DOT_VERT = `
attribute float aSeed;
uniform float uTime,uZ1,uSpan,uPx;
varying float vA;
void main(){
  vec3 p=position;
  p.z=uZ1+mod(p.z-uZ1+uTime*(1.4+aSeed*2.),uSpan);
  vec4 mv=modelViewMatrix*vec4(p,1.);
  float tw=pow(.5+.5*sin(uTime*(1.+aSeed*3.)+aSeed*40.),6.);
  vA=(.2+tw*.9)*(1.-smoothstep(uSpan*.5,uSpan*1.1,-mv.z));
  gl_PointSize=-mv.z<.1?0.:uPx*(1.+tw*2.5)/-mv.z;
  gl_Position=projectionMatrix*mv;
}`;

const FADE_FRAG = `
varying float vA;
void main(){gl_FragColor=vec4(vec3(1.),vA);}`;

const DOT_FRAG = `
varying float vA;
void main(){gl_FragColor=vec4(vec3(1.),vA*smoothstep(.5,0.,length(gl_PointCoord-.5)));}`;

const EDGE_VERT = `
uniform float uTime,uSweep;
varying float vA;
void main(){
  vec4 w=modelMatrix*vec4(position,1.);
  float s=mod(uTime*4.,uSweep*2.+10.)-uSweep-5.;
  float g=(w.x-s)/1.1;
  vA=.62+.38*exp(-g*g);
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

const EDGE_FRAG = `
uniform vec3 uInk;
uniform float uFlat;
varying float vA;
void main(){gl_FragColor=vec4(mix(vec3(vA),uInk,uFlat),1.);}`;

const COMP_VERT = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

// mode 0: tiles flash the world through the page; mode 1: a radial wipe with a glowing edge, with the lifting letters drawn over the page outside it
const COMP_FRAG = `
uniform sampler2D tScene,tFlat;
uniform float uAspect,uTime,uMode,uTile,uWipe,uPulse,uSeed;
varying vec2 vUv;
${NOISE}
vec3 split(vec2 uv,float c){
  vec2 d=uv-.5;
  return vec3(texture2D(tScene,uv+d*c).r,texture2D(tScene,uv).g,texture2D(tScene,uv-d*c).b);
}
void main(){
  vec2 d=vUv-.5;d.x*=uAspect;
  float r=length(d);
  float maxR=.5*sqrt(uAspect*uAspect+1.);
  float nr=r/maxR;
  vec2 q=vUv-.5;
  vec2 uv=.5+q*(1.-uPulse*.22*dot(q,q)*4.);
  float chroma=.006*nr+uPulse*.035*nr+(1.-step(.5,uMode))*.012;
  float blur=smoothstep(.5,1.,nr)*.1;
  vec3 col=vec3(0.);
  for(int i=0;i<6;i++){col+=split(.5+(uv-.5)*(1.-blur*float(i)/6.),chroma);}
  col/=6.;
  col*=1.-smoothstep(.75,1.15,nr)*.55;
  float mask=1.;
  if(uMode<.5){
    vec2 grid=vec2(20.,20./uAspect);
    vec2 cell=floor(vUv*grid);
    vec2 tc=cell;float size=1.;
    vec2 c3=floor(cell/3.)*3.,c2=floor(cell/2.)*2.;
    if(hash(c3+uSeed+7.3)>.85){tc=c3;size=3.;}else if(hash(c2+uSeed+7.3)>.55){tc=c2;size=2.;}
    vec2 tcen=(tc+size*.5)/grid-.5;tcen.x*=uAspect;
    float spawn=length(tcen)/maxR*.55+hash(tc+uSeed)*.3+(size-1.)*.15;
    float build=clamp(uTile*2.,0.,1.)*.9;
    float fade=clamp((uTile-.5)*2.,0.,1.);
    mask=step(spawn,build)*(1.-step(hash(tc+uSeed+99.7),fade));
    float rays=fbm(normalize(d+1e-4)*18.+vec2(r*1.5-uTime*1.2,0.));
    col+=vec3(.06,.36,1.)*smoothstep(.2,1.,nr)*(.35+rays*1.1);
    col+=vec3(.7,.92,1.)*pow(smoothstep(.55,1.2,nr),3.)*(.5+rays);
  }else{
    float dist=r+(fbm(normalize(d+1e-4)*2.5+vec2(r*3.,0.)+uTime*2.5)-.5)*.25;
    float R=uWipe*(maxR+.4);
    mask=smoothstep(R,R-.25,dist);
    float live=step(.001,uWipe)*(1.-step(.999,uWipe));
    float g=(dist-R)/.045;
    float band=exp(-g*g)*live*(.5+.5*fbm(vUv*12.+uTime*2.));
    col+=vec3(.6,.85,1.)*band*1.8;
    mask=max(mask,band);
  }
  vec4 lift=uMode<.5?vec4(0.):texture2D(tFlat,vUv);
  gl_FragColor=vec4(col*mask+lift.rgb*(1.-mask),mask+lift.a*(1.-mask));
}`;

type Placed = { obj: Group | Mesh; x: number; y: number; z: number; sx: number; sy: number; sz: number; delay: number };
type World = {
  tiles: (delay: number) => void;
  setDeep: (on: boolean) => void;
  relayout: () => void;
  dispose: () => void;
};
type Rgb = [number, number, number];

const probe = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d", { willReadFrequently: true });

// canvas normalises any css colour (oklch included) to srgb bytes
function rgb(css: string, fallback: Rgb): Rgb {
  if (!probe) return fallback;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return a ? [r / 255, g / 255, b / 255] : fallback;
}

function baseline(font: string, top: number, height: number) {
  if (!probe) return top + height * 0.8;
  probe.font = font;
  const m = probe.measureText("Hg");
  const ascent = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent;
  return top + (height - ascent - descent) / 2 + ascent;
}

function measure(root: HTMLElement) {
  const box = root.getBoundingClientRect();
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
  };
  const head = root.querySelector(".dh-head");
  const headStyle = head && getComputedStyle(head);
  const tagEl = root.querySelector<HTMLElement>(".dh-tag");
  const tagStyle = tagEl && getComputedStyle(tagEl);
  const fontOf = (st: CSSStyleDeclaration) => `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  const page = rgb(getComputedStyle(root).backgroundColor, [1, 1, 1]);
  return {
    words: [...root.querySelectorAll(".dh-word")].map((el) => {
      const r = rel(el);
      return { text: el.textContent ?? "", ...r, base: headStyle ? baseline(fontOf(headStyle), r.y, r.h) : r.y + r.h * 0.8 };
    }),
    fontSize: headStyle ? parseFloat(headStyle.fontSize) : 100,
    headTop: head ? rel(head).y : 0,
    ink: headStyle ? rgb(headStyle.color, [0, 0, 0]) : ([0, 0, 0] as Rgb),
    page,
    tag:
      tagEl && tagStyle
        ? {
            text: tagEl.textContent ?? "",
            font: fontOf(tagStyle),
            ink: rgb(tagStyle.color, [0, 0, 0]),
            ...rel(tagEl),
          }
        : null,
  };
}

function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function geometry(attrs: Record<string, [number[], number]>) {
  const g = new BufferGeometry();
  for (const [name, [data, size]] of Object.entries(attrs)) g.setAttribute(name, new Float32BufferAttribute(data, size));
  return g;
}

const shader = (vertexShader: string, fragmentShader: string, uniforms: Record<string, { value: unknown }>) =>
  new ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending });

function createWorld(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  font: Font,
  TextGeometry: typeof TextGeometryType,
  reduced: boolean,
): World {
  const renderer = new WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  const target = new WebGLRenderTarget(1, 1, { samples: 4 });
  const flatTarget = new WebGLRenderTarget(1, 1, { samples: 4 });
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 400);

  const time = { value: 0 };
  const fill = new MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const edge = new ShaderMaterial({
    vertexShader: EDGE_VERT,
    fragmentShader: EDGE_FRAG,
    uniforms: { uTime: time, uSweep: { value: 8 }, uInk: { value: [0, 0, 0] }, uFlat: { value: 0 } },
  });
  const roomU = { uTime: time, uStep: { value: 1.25 }, uZ1: { value: -DIST * 3 }, uSpan: { value: DIST * 4.2 }, uNear: { value: DIST * 0.6 }, uFar: { value: DIST * 4 } };
  const grid = shader(GRID_VERT, FADE_FRAG, roomU);
  const streak = shader(STREAK_VERT, FADE_FRAG, { uTime: time, uOrigin: { value: [0, 0, -DIST * 0.6] } });
  const dust = shader(DOT_VERT, DOT_FRAG, { uTime: time, uZ1: roomU.uZ1, uSpan: roomU.uSpan, uPx: { value: 3 * dpr * DIST } });
  const comp = new ShaderMaterial({
    vertexShader: COMP_VERT,
    fragmentShader: COMP_FRAG,
    uniforms: {
      tScene: { value: target.texture },
      tFlat: { value: flatTarget.texture },
      uAspect: { value: 1 },
      uTime: time,
      uMode: { value: 0 },
      uTile: { value: 0 },
      uWipe: { value: 0 },
      uPulse: { value: 0 },
      uSeed: { value: 322 },
    },
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const compGeo = new PlaneGeometry(2, 2);
  const compScene = new Scene().add(new Mesh(compGeo, comp));
  const compCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const glyphs = new Map<string, { solid: BufferGeometry; edges: BufferGeometry }>();
  const glyph = (ch: string) => {
    let g = glyphs.get(ch);
    if (!g) {
      const solid = new TextGeometry(ch, { font, size: 1, depth: 1, curveSegments: 6, bevelEnabled: false });
      solid.translate(0, 0, -1);
      g = { solid, edges: new EdgesGeometry(solid, 25) };
      glyphs.set(ch, g);
    }
    return g;
  };

  let world = new Group();
  let owned: { dispose: () => void }[] = [];
  let placed: Placed[] = [];
  let headTop = 0;
  let k = 1;
  let ink: Rgb = [0, 0, 0];
  let edgeInk: Rgb = [0, 0, 0];
  let tagInk: Rgb = [0, 0, 0];
  let tagMat: MeshBasicMaterial | null = null;
  let atmosphere: (LineSegments | Points)[] = [];

  const build = () => {
    const W = root.clientWidth;
    const H = root.clientHeight;
    renderer.setSize(W, H, false);
    target.setSize(W * dpr, H * dpr);
    flatTarget.setSize(W * dpr, H * dpr);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    comp.uniforms.uAspect.value = W / H;
    scene.remove(world);
    for (const o of owned) o.dispose();
    owned = [];
    placed = [];
    world = new Group();
    scene.add(world);

    k = WORLD_H / H;
    const halfW = (W * k) / 2;
    const snap = measure(root);
    headTop = snap.headTop;
    ink = snap.ink;
    edgeInk = snap.ink.map((c, i) => c * 0.55 + snap.page[i] * 0.45) as Rgb;
    tagInk = snap.tag?.ink ?? ink;
    atmosphere = [];
    tagMat = null;
    const rand = seeded(7);
    const res = font.data.resolution;
    edge.uniforms.uSweep.value = halfW;

    const place = (obj: Group | Mesh, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      world.add(obj);
      placed.push({ obj, x, y, z, sx, sy, sz, delay: Math.min(0.3, Math.max(0, ((x + halfW) / (halfW * 2)) * 0.24 + rand() * 0.06)) });
    };

    for (const word of snap.words) {
      const chars = [...word.text];
      const advances = chars.map((c) => (font.data.glyphs[c]?.ha ?? res * 0.3) / res + TRACKING);
      const size = Math.min(word.w / (advances.reduce((a, b) => a + b, 0) - TRACKING), snap.fontSize * 1.2) * k;
      const height = snap.fontSize * k;
      let pen = word.x * k - halfW;
      const base = WORLD_H / 2 - word.base * k;
      chars.forEach((c, i) => {
        if (c.trim()) {
          const g = glyph(c);
          const letter = new Group().add(new Mesh(g.solid, fill), new LineSegments(g.edges, edge));
          place(letter, pen, base, (rand() - 0.6) * DIST * 0.5, size, height, height * (0.25 + rand() * 0.9));
        }
        pen += advances[i] * size;
      });
    }

    if (snap.tag) {
      const t = snap.tag;
      const c = document.createElement("canvas");
      c.width = Math.ceil(t.w * 2);
      c.height = Math.ceil(t.h * 2);
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.font = t.font;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(t.text, t.w / 2, baseline(t.font, 0, t.h));
      }
      const map = new CanvasTexture(c);
      const geo = new PlaneGeometry(1, 1);
      tagMat = new MeshBasicMaterial({ map, transparent: true, depthWrite: false });
      tagMat.color.setRGB(0.75, 0.75, 0.75, LinearSRGBColorSpace);
      place(new Mesh(geo, tagMat), (t.x + t.w / 2) * k - halfW, WORLD_H / 2 - (t.y + t.h / 2) * k, -DIST * 0.35, t.w * k, t.h * k, 1);
      owned.push(map, geo, tagMat);
    }

    const A = Math.max(halfW * 1.25, 8);
    const B = WORLD_H * 0.75;
    const step = roomU.uStep.value;
    const z1 = roomU.uZ1.value;
    const z0 = z1 + roomU.uSpan.value;
    const room: number[] = [];
    const seg = (...p: number[]) => room.push(...p);
    for (let z = z1; z < z0; z += step) {
      seg(-A, -B, z, A, -B, z);
      seg(-A, B, z, A, B, z);
      seg(-A, -B, z, -A, B, z);
      seg(A, -B, z, A, B, z);
      // long lines are cut per cell so the depth fade runs along them
      for (let x = -A; x <= A + 1e-6; x += step) seg(x, -B, z, x, -B, z + step, x, B, z, x, B, z + step);
      for (let y = -B; y <= B + 1e-6; y += step) seg(-A, y, z, -A, y, z + step, A, y, z, A, y, z + step);
    }
    for (let x = -A; x <= A + 1e-6; x += step) seg(x, -B, z1, x, B, z1);
    for (let y = -B; y <= B + 1e-6; y += step) seg(-A, y, z1, A, y, z1);

    const dirs: number[] = [];
    const seeds: number[] = [];
    const ends: number[] = [];
    const specks: number[] = [];
    const speckSeeds: number[] = [];
    for (let i = 0; i < 600; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const seed = rand();
      for (const end of [0, 1]) {
        dirs.push(s * Math.cos(a), u, s * Math.sin(a));
        seeds.push(seed);
        ends.push(end);
      }
    }
    for (let i = 0; i < 900; i++) {
      specks.push((rand() * 2 - 1) * A, (rand() * 2 - 1) * B, z1 + rand() * (z0 - z1));
      speckSeeds.push(rand());
    }
    const roomGeo = geometry({ position: [room, 3] });
    const rayGeo = geometry({ position: [dirs, 3], aSeed: [seeds, 1], aEnd: [ends, 1] });
    const speckGeo = geometry({ position: [specks, 3], aSeed: [speckSeeds, 1] });
    const rays = new LineSegments(rayGeo, streak);
    const dots = new Points(speckGeo, dust);
    rays.frustumCulled = false;
    dots.frustumCulled = false;
    atmosphere = [new LineSegments(roomGeo, grid), rays, dots];
    world.add(...atmosphere);
    owned.push(roomGeo, rayGeo, speckGeo);
  };

  const aim = { x: 0.35, y: 0.15 };
  const cam = { yaw: 0, pitch: 0, open: 0, fly: 0, flyTo: 0 };
  let phase: "idle" | "tiles" | "in" | "deep" | "out" = "idle";
  let phaseAt = 0;
  let frame = 0;
  let pending = 0;
  let timer = 0;
  let last = 0;
  const born = performance.now();

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    aim.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    aim.y = 1 - ((e.clientY - r.top) / r.height) * 2;
  };
  const onWheel = (e: WheelEvent) => {
    if (phase !== "in" && phase !== "deep") return;
    e.preventDefault();
    cam.flyTo = Math.min(DIST * 2.4, Math.max(-DIST * 0.2, cam.flyTo + e.deltaY * 0.01));
  };
  root.addEventListener("pointermove", onMove);
  root.addEventListener("wheel", onWheel, { passive: false });

  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp = (x: number) => Math.min(1, Math.max(0, x));

  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const span = phase === "tiles" ? TILE_TIME : phase === "in" ? LIFT_IN : LIFT_OUT;
    const p = reduced ? 1 : clamp((now - phaseAt) / 1000 / span);
    const lifting = phase === "in" || phase === "out";
    const u = comp.uniforms;
    u.uMode.value = phase === "tiles" ? 0 : 1;
    u.uTile.value = 1 - Math.pow(1 - p, 3);
    u.uWipe.value = phase === "in" ? ease((p - 0.12) / 0.85) : phase === "out" ? 1 - ease(p / 0.65) : 1;
    u.uPulse.value = phase === "tiles" ? 1 : lifting && !reduced ? Math.sin(Math.PI * p) : 0;
    time.value = reduced ? 0 : (now - born) / 1000;

    // the camera opens dead on so the lift starts on the flat headline, and is back dead on before it lands
    const opening = phase === "in" || phase === "deep";
    const rate = phase === "out" ? 5 : 2.5;
    cam.open = reduced ? Number(opening) : cam.open + (Number(opening) - cam.open) * (1 - Math.exp(-dt * rate));
    if (!opening) cam.flyTo = 0;
    const drift = reduced ? 0 : Math.sin(time.value * 0.25) * 0.12;
    const follow = 1 - Math.exp(-dt * 4);
    cam.yaw += ((aim.x * 0.45 + drift) * cam.open - cam.yaw) * follow;
    cam.pitch += (aim.y * 0.22 * cam.open - cam.pitch) * follow;
    cam.fly += (cam.flyTo - cam.fly) * (1 - Math.exp(-dt * rate * 1.2));
    const cp = Math.cos(cam.pitch);
    camera.position.set(DIST * Math.sin(cam.yaw) * cp, DIST * Math.sin(cam.pitch), DIST * Math.cos(cam.yaw) * cp - cam.fly);
    camera.lookAt(0, 0, -cam.fly);

    // follow the headline while it is still rising on load
    const head = root.querySelector(".dh-head");
    const dy = head ? (head.getBoundingClientRect().top - root.getBoundingClientRect().top - headTop) * k : 0;
    for (const item of placed) {
      // each letter peels off the page into its depth, scaled so the front view keeps reading as the headline
      const m = phase === "in" ? ease((p - item.delay) / 0.55) : phase === "out" ? 1 - ease((p - 0.15 - item.delay) / 0.55) : 1;
      const z = item.z * m;
      const f = (DIST - z) / DIST;
      item.obj.position.set(item.x * f, (item.y - dy) * f, z);
      item.obj.scale.set(item.sx * f, item.sy * f, Math.max(1e-3, item.sz * m) * f);
    }

    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, camera);
    if (lifting) {
      for (const a of atmosphere) a.visible = false;
      fill.color.setRGB(...ink, LinearSRGBColorSpace);
      edge.uniforms.uInk.value = edgeInk;
      edge.uniforms.uFlat.value = 1;
      tagMat?.color.setRGB(...tagInk, LinearSRGBColorSpace);
      renderer.setRenderTarget(flatTarget);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      for (const a of atmosphere) a.visible = true;
      fill.color.setRGB(0, 0, 0);
      edge.uniforms.uFlat.value = 0;
      tagMat?.color.setRGB(0.75, 0.75, 0.75, LinearSRGBColorSpace);
    }
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    if (p >= 1 && (phase === "tiles" || phase === "out")) {
      phase = "idle";
      last = 0;
      root.removeAttribute("data-lifted");
      return;
    }
    if (p >= 1 && phase === "in") phase = "deep";
    renderer.render(compScene, compCam);
    if (phase !== "tiles") root.setAttribute("data-lifted", "");
    frame = requestAnimationFrame(tick);
  };

  const go = (next: typeof phase) => {
    phase = next;
    phaseAt = performance.now();
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(build);
  });
  build();
  ro.observe(root);

  return {
    tiles: (delay) => {
      timer = window.setTimeout(() => phase === "idle" && go("tiles"), delay * 1000);
    },
    relayout: () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(build);
    },
    setDeep: (on) => {
      if (on && phase !== "in" && phase !== "deep") go("in");
      if (!on && (phase === "in" || phase === "deep")) go("out");
    },
    dispose: () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      ro.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("wheel", onWheel);
      for (const o of owned) o.dispose();
      for (const g of glyphs.values()) {
        g.solid.dispose();
        g.edges.dispose();
      }
      for (const m of [fill, edge, grid, streak, dust, comp]) m.dispose();
      compGeo.dispose();
      target.dispose();
      flatTarget.dispose();
      root.removeAttribute("data-lifted");
      renderer.dispose();
    },
  };
}

export function DimensionHero({
  headline = "Draw outside the frame",
  tagline = "Every flat page hides a little depth. The pill knows where.",
  className,
  ...props
}: DimensionHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const deepRef = useRef(false);
  const [deep, setDeep] = useState(false);
  const [ready, setReady] = useState(false);
  const words = headline.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let gone = false;
    const born = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Promise.all([
      import("three/addons/loaders/FontLoader.js"),
      import("three/addons/geometries/TextGeometry.js"),
      import("three/examples/fonts/helvetiker_bold.typeface.json"),
    ]).then(([{ FontLoader }, { TextGeometry }, json]) => {
      if (gone) return;
      let world: World;
      try {
        world = createWorld(canvas, root, new FontLoader().parse(json.default ?? json), TextGeometry, reduced);
      } catch {
        return;
      }
      worldRef.current = world;
      setReady(true);
      if (deepRef.current) world.setDeep(true);
      else if (!reduced) world.tiles(Math.max(0, TILE_START - (performance.now() - born) / 1000));
    });
    return () => {
      gone = true;
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => worldRef.current?.relayout(), [headline, tagline]);

  useEffect(() => {
    deepRef.current = deep;
    worldRef.current?.setDeep(deep);
    if (!deep) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDeep(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deep]);

  return (
    <section
      ref={rootRef}
      data-slot="dimension-hero"
      className={cn("dh-root relative isolate overflow-hidden bg-background text-foreground", className)}
      {...props}
    >
      <style>{CSS}</style>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="dh-stage flex flex-col items-center">
          <h1
            aria-label={headline}
            className="dh-head text-center leading-[0.8] tracking-[-0.04em] text-balance select-none"
          >
            {words.map((word, i) => (
              <span key={i}>
                <span
                  aria-hidden
                  className="dh-word"
                  data-side={i % 2 ? "right" : "left"}
                  data-shape={SHAPES[i % 4]}
                  style={{ "--d": `${(i * STAGGER).toFixed(2)}s`, "--dir": i % 2 ? 1 : -1 } as CSSProperties}
                >
                  <span className="dh-text">{word}</span>
                </span>
                {i < words.length - 1 && " "}
              </span>
            ))}
          </h1>
          <p className="dh-tag mt-6 text-center text-[clamp(14px,2.2cqw,20px)] leading-[1.1]">{tagline}</p>
        </div>
      </div>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
      {ready && (
        <button
          type="button"
          aria-pressed={deep}
          aria-label={deep ? "Leave the 3D view" : "See this hero in 3D"}
          onClick={() => setDeep((d) => !d)}
          className="dh-pill absolute right-3 bottom-3 z-10 grid size-14 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <span
            className="dh-capsule relative block h-11 w-5 overflow-hidden rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-110"
            style={{
              background: deep ? "linear-gradient(#c6f432 50%, #1c1c1c 50%)" : "linear-gradient(#2b2b2b 50%, #8b8f98 50%)",
            }}
          >
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(0,0,0,0.35),transparent_35%,rgba(255,255,255,0.55)_52%,transparent_68%,rgba(0,0,0,0.3))]" />
          </span>
        </button>
      )}
    </section>
  );
}
