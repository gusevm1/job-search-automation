"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Briefcase, TrendingUp, Users } from "lucide-react";

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 1.1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 1.2,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const statCards = [
    {
      icon: Briefcase,
      label: "Active Jobs",
      value: "0",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: "0%",
      color: "text-secondary",
    },
    {
      icon: Users,
      label: "Interviews",
      value: "0",
      color: "text-primary",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div
          variants={imageVariants}
          initial="hidden"
          animate="visible"
          className="relative h-full w-full"
        >
          <Image
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
            alt="Professional workspace"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          {/* Dark gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60 dark:from-background/98 dark:via-background/90 dark:to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80 dark:from-background/70 dark:via-transparent dark:to-background/95" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-6 py-16 md:px-12 md:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl space-y-6">
            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Find Your Next{" "}
              <span className="text-primary">Opportunity</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground md:text-xl lg:text-2xl"
            >
              Automated job searching powered by your CV. Let AI streamline your
              career advancement.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Upload CV
              </Button>
            </motion.div>
          </div>

          {/* Stat Cards */}
          <motion.div
            variants={itemVariants}
            className="mt-12 grid gap-4 sm:grid-cols-3 md:mt-16 lg:mt-20"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={
                  prefersReducedMotion
                    ? {}
                    : {
                        y: -4,
                        transition: { duration: 0.2 },
                      }
                }
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                      <stat.icon className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
