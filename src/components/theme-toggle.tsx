"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-full justify-start gap-2">
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-full justify-start gap-2"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm">Light Mode</span>
        </>
      )}
    </Button>
  );
}
