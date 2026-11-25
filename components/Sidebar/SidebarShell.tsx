"use client";

import { useEffect } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
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
  // the side panels take about 590px, so below this width the preview would be squeezed to a sliver
  const isMobile = useMediaQuery("(max-width: 1199px)");

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
