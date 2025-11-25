"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [showHighlight, setShowHighlight] = React.useState(false);
  const [swingAnimation, setSwingAnimation] = React.useState(false);
  const [titleAnimation, setTitleAnimation] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Onboarding animation sequence
  React.useEffect(() => {
    if (hasSeenOnboarding || prefersReducedMotion) return;

    const sequence = async () => {
      // Start title animation immediately
      setTitleAnimation(true);

      // Wait for page to load and hero animation to start
      await new Promise((resolve) => setTimeout(resolve, 2400));

      // Highlight the menu button
      setShowHighlight(true);

      // Start heartbeat animation
      await new Promise((resolve) => setTimeout(resolve, 300));
      setSwingAnimation(true);

      // Wait for heartbeat to complete, then do it again
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setSwingAnimation(false);

      await new Promise((resolve) => setTimeout(resolve, 200));
      setSwingAnimation(true);

      // Wait and remove highlight
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setSwingAnimation(false);
      setShowHighlight(false);

      // Mark as seen (disabled for development)
      // localStorage.setItem("hasSeenMenuOnboarding", "true");
      setHasSeenOnboarding(true);
    };

    sequence();
  }, [hasSeenOnboarding, prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:h-20">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <div className="relative">
                {/* Highlight ring animation */}
                {showHighlight && (
                  <motion.div
                    className="absolute -inset-3 rounded-xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: [0, 1, 1, 0.8],
                      scale: [0.8, 1.1, 1.05, 1.1],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))",
                      boxShadow: "0 0 20px hsl(var(--primary) / 0.5)",
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("relative h-14 w-14", swingAnimation && "animate-heartbeat")}
                  aria-label="Toggle menu"
                >
                  <Menu className="h-9 w-9" />
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <h1 className={cn(
            "flex-1 text-center text-xl font-semibold md:text-2xl",
            !hasSeenOnboarding && !titleAnimation && "opacity-0",
            titleAnimation && "animate-fade-in-down"
          )}>Jobflow</h1>
          <div className="w-14" /> {/* Spacer for centering */}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
