// src/store/display.ts

import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

interface MenuItem {
  title: string;
  url: string;
  children?: MenuItem[];
}

interface DisplayState {
  breakpoint: string;
  isMobile: boolean;
  isMiniMobile: boolean;
  theme: "light" | "dark";
  isSidebarOpen: boolean;
  menuItems: MenuItem[];
}

const initialState: DisplayState = {
  breakpoint: "",
  isMobile: false,
  isMiniMobile: false,
  theme: "light",
  isSidebarOpen: false,
  menuItems: [],
};

export const $display = persistentAtom<DisplayState>(
  "display-state",
  initialState,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

const breakpoints = {
  "min-xs": "(max-width: 239px)",
  xs: "(min-width: 240px) and (max-width: 599px)",
  sm: "(min-width: 600px) and (max-width: 959px)",
  md: "(min-width: 960px) and (max-width: 1279px)",
  lg: "(min-width: 1280px) and (max-width: 1919px)",
  xl: "(min-width: 1920px) and (max-width: 2559px)",
  xxl: "(min-width: 2560px)",
};

export function initializeDisplay() {
  if (typeof window === "undefined") {
    return;
  }
  const mediaQueries = Object.entries(breakpoints).map(([key, query]) => [
    key,
    window.matchMedia(query),
  ]);

  const updateBreakpoint = () => {
    const currentBreakpoint =
      mediaQueries.find(([, mq]) => mq.matches)?.[0] || "";
    $display.set({
      ...$display.get(),
      breakpoint: currentBreakpoint,
      isMobile: currentBreakpoint === "xs",
      isMiniMobile: currentBreakpoint === "min-xs",
    });
  };

  mediaQueries.forEach(([, mq]) =>
    mq.addEventListener("change", updateBreakpoint)
  );
  updateBreakpoint();
}

export function toggleTheme() {
  $display.set({
    ...$display.get(),
    theme: $display.get().theme === "light" ? "dark" : "light",
  });
}

export function toggleSidebar() {
  $display.set({
    ...$display.get(),
    isSidebarOpen: !$display.get().isSidebarOpen,
  });
}
