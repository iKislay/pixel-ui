import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PIXEL_PETAL } from "@/components/logos";
import { charAlpha, SKYLINE } from "@/lib/ascii";
import {
  CATEGORY_LABELS,
  components,
  REGISTRY_REPO,
} from "@/lib/components";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

const fonts = Promise.all([
  font("InstrumentSerif-Regular.ttf"),
  font("InstrumentSerif-Italic.ttf"),
  font("NunitoSans-Regular.ttf"),
  font("NunitoSans-Bold.ttf"),
  font("GeistMono-Regular.ttf"),
]);

const SKYLINE_RUNS = SKYLINE.map((line) => {
  const runs: { text: string; alpha: number }[] = [];
  for (const char of line) {
    const last = runs.at(-1);
    const alpha = char === " " ? (last?.alpha ?? 0) : charAlpha(char);
    if (last?.alpha === alpha) last.text += char;
    else runs.push({ text: char, alpha });
  }
  return runs;
});

const CARD_INSET = 28;
const SKYLINE_FONT = (size.width - CARD_INSET * 2 - 2) / SKYLINE[0].length / 0.6;

function Mark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256">
      {[0, 90, 180, 270].map((angle) => (
        <path
          key={angle}
          d={PIXEL_PETAL}
          transform={`rotate(${angle} 128 128)`}
          fill={color}
        />
      ))}
    </svg>
  );
}

export type OgContent = {
  eyebrow?: string;
  title: string;
  italic?: string;
  description: string;
  pills?: string[];
};

export async function ogImage({
  eyebrow,
  title,
  italic,
  description,
  pills = [],
}: OgContent) {
  const [serif, serifItalic, sans, sansBold, mono] = await fonts;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: CARD_INSET,
          background: "#0B0C0D",
          fontFamily: "Nunito Sans",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 56px 0",
            overflow: "hidden",
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#111214",
            color: "white",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              bottom: -40,
              display: "flex",
            }}
          >
            <Mark size={340} color="rgba(255,255,255,0.045)" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mark size={28} color="white" />
              <span style={{ fontSize: 28, fontWeight: 700 }}>Pixel UI</span>
            </div>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.55)" }}>
              pixelui.dev
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: eyebrow ? 44 : 64,
            }}
          >
            {eyebrow && (
              <span
                style={{
                  fontFamily: "Geist Mono",
                  fontSize: 16,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 18,
                }}
              >
                {eyebrow}
              </span>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                columnGap: 22,
                fontFamily: "Instrument Serif",
                fontSize: 92,
                lineHeight: 1,
                letterSpacing: -1.5,
              }}
            >
              {title ? <span>{title}</span> : null}
              {italic && <span style={{ fontStyle: "italic" }}>{italic}</span>}
            </div>

            <div
              style={{
                marginTop: 26,
                maxWidth: 860,
                fontSize: 26,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.55)",
                display: "block",
                lineClamp: 2,
              }}
            >
              {description}
            </div>

            {pills.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                {pills.map((pill) => (
                  <span
                    key={pill}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.03)",
                      fontSize: 19,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              fontFamily: "Geist Mono",
              fontSize: SKYLINE_FONT,
              lineHeight: `${SKYLINE_FONT * 0.78}px`,
            }}
          >
            {SKYLINE_RUNS.map((runs, row) => (
              <div key={row} style={{ display: "flex" }}>
                {runs.map((run, index) => (
                  <span
                    key={index}
                    style={{
                      whiteSpace: "pre",
                      color: `rgba(255,255,255,${run.alpha})`,
                    }}
                  >
                    {run.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
        { name: "Nunito Sans", data: sans, style: "normal", weight: 400 },
        { name: "Nunito Sans", data: sansBold, style: "normal", weight: 700 },
        { name: "Geist Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}

const findComponent = (href: string) => {
  const item = components.find((c) => c.href === href);
  if (!item) throw new Error(`no component at ${href}`);
  return item;
};

export const componentOgAlt = (href: string) =>
  `${findComponent(href).name}, an animated React component from Pixel UI`;

export function componentOgImage(href: string) {
  const item = findComponent(href);
  const words = item.name.split(" ");

  return ogImage({
    eyebrow: `Component · ${CATEGORY_LABELS[item.category]}`,
    title: words.slice(0, -1).join(" "),
    italic: words.at(-1),
    description: item.description ?? "",
    pills: [
      `npx shadcn add ${REGISTRY_REPO}/${item.registry}`,
      ...(item.dependencies ?? []).map((dep) => dep.name),
    ],
  });
}
