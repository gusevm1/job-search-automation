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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [showHighlight, setShowHighlight] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Check if user has seen the onboarding animation
  React.useEffect(() => {
    const seen = localStorage.getItem("hasSeenMenuOnboarding");
    if (!seen && !prefersReducedMotion) {
      setHasSeenOnboarding(false);
    }
  }, [prefersReducedMotion]);

  // Onboarding animation sequence
  React.useEffect(() => {
    if (hasSeenOnboarding || prefersReducedMotion) return;

    const sequence = async () => {
      // Wait for page to load and hero animation to start
      await new Promise((resolve) => setTimeout(resolve, 2400));

      // Highlight the menu button
      setShowHighlight(true);

      // Wait, then open the menu
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOpen(true);

      // Keep open briefly, then close
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOpen(false);

      // Remove highlight
      await new Promise((resolve) => setTimeout(resolve, 400));
      setShowHighlight(false);

      // Mark as seen
      localStorage.setItem("hasSeenMenuOnboarding", "true");
      setHasSeenOnboarding(true);
    };

    sequence();
  }, [hasSeenOnboarding, prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <div className="relative">
                {/* Highlight ring animation */}
                {showHighlight && (
                  <motion.div
                    className="absolute -inset-2 rounded-lg"
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
                  className="relative mr-2"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Job Search Automation</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
