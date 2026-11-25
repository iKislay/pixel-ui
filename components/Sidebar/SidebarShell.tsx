"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { resetPreviewReducedMotion } from "@/lib/preview-reduced-motion";
import DesktopShell from "./DesktopShell";
import MobileShell from "./MobileShell";
import { PreviewControlsProvider } from "../preview/PreviewControls";
import { PreviewKeyboardProvider } from "../preview/PreviewKeyboard";

const subscribeNever = () => () => {};

export default function SidebarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // the side panels take about 590px, so below this width the preview would be squeezed to a sliver
  const isMobile = useMediaQuery("(max-width: 1199px)");
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  useEffect(() => () => resetPreviewReducedMotion(), []);

  return (
    <PreviewControlsProvider>
      <PreviewKeyboardProvider>
        {/* the server cannot see the screen, so it sends both layouts and css shows the right one; hydration then drops the other */}
        <div className="contents min-[1200px]:hidden">{(!hydrated || isMobile) && <MobileShell>{children}</MobileShell>}</div>
        <div className="contents max-[1199px]:hidden">{(!hydrated || !isMobile) && <DesktopShell>{children}</DesktopShell>}</div>
      </PreviewKeyboardProvider>
    </PreviewControlsProvider>
  );
}
