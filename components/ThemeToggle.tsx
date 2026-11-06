"use client";

import { ThemeToggle as UiThemeToggle, type ThemeToggleProps } from "@/components/ui/theme-toggle";
import { feedback } from "@/lib/feedback";

export default function ThemeToggle({ onClick, ...props }: ThemeToggleProps) {
  return (
    <UiThemeToggle
      onClick={(event) => {
        feedback("tick");
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export { UiThemeToggle as ThemeToggle };
