import type { ComponentProps } from "react";
import { SKYLINE } from "@/lib/ascii";
import AsciiArt from "./AsciiArt";

export default function AsciiSkyline(props: ComponentProps<"div">) {
  return (
    <AsciiArt
      lines={SKYLINE}
      role="img"
      aria-label="Indian monuments skyline ascii art: Gateway of India, Charminar, Golden Temple, Jama Masjid, India Gate, Lotus Temple, Taj Mahal"
      {...props}
    />
  );
}
