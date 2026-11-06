"use client";

import { ThemeToggle as UiThemeToggle, type ThemeToggleProps } from "@/components/ui/theme-toggle";

export default function ThemeToggle(props: ThemeToggleProps) {
  return <UiThemeToggle {...props} />;
}

export { UiThemeToggle as ThemeToggle };
