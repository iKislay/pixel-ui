"use client";

import { useEffect } from "react";
import { useIsMobile } from "@/lib/use-media-query";
import { resetPreviewReducedMotion } from "@/lib/preview-reduced-motion";
import DesktopShell from "./DesktopShell";
import MobileShell from "./MobileShell";
import { PreviewControlsProvider } from "../preview/PreviewControls";
import { PreviewKeyboardProvider } from "../preview/PreviewKeyboard";

export default function SidebarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  useEffect(() => () => resetPreviewReducedMotion(), []);

  return (
    <PreviewControlsProvider>
      <PreviewKeyboardProvider>
        {isMobile ? (
          <MobileShell>{children}</MobileShell>
        ) : (
          <DesktopShell>{children}</DesktopShell>
        )}
      </PreviewKeyboardProvider>
    </PreviewControlsProvider>
  );
}
