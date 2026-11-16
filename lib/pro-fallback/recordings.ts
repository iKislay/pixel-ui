import type { ComponentType } from "react";
import type { RecordingProps } from "@/components/recordings/Player";

// stands in for pro/recordings when the private pro repo is not checked out
export const PRO_RECORDINGS: Record<string, ComponentType<RecordingProps>> = {};
