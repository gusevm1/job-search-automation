"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Search,
  Target,
  ArrowRight,
  Upload,
  Cpu,
  ListFilter,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const workflowSteps = [
    {
      icon: Upload,
      title: "Upload CV",
      description: "Drop your PDF resume and let Claude AI extract your skills, experience, and preferences.",
    },
    {
      icon: Cpu,
      title: "AI Processing",
      description: "Your profile is analyzed to generate optimal search queries for Swiss job boards.",
    },
    {
      icon: Search,
      title: "Smart Scraping",
      description: "Firecrawl API scrapes multiple job boards in parallel with 30s timeout protection.",
    },
    {
      icon: ListFilter,
      title: "Match & Score",
      description: "Jobs are scored against your profile using skill matching, education, and experience weights.",
    },
  ];

  const features = [
    {
      icon: FileText,
      title: "CV Analysis",
      description: "Claude AI extracts structured data from your resume automatically.",
    },
    {
      icon: Search,
      title: "Multi-Board Search",
      description: "Search SwissDevJobs, Jobs.ch, Indeed, Glassdoor, and more simultaneously.",
    },
    {
      icon: Target,
      title: "Intelligent Matching",
      description: "Advanced scoring algorithm with 34 skill synonym groups for ML/AI, cloud, and web.",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
            alt="Professional workspace"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60 dark:from-background/98 dark:via-background/90 dark:to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80 dark:from-background/70 dark:via-transparent dark:to-background/95" />
        </div>

        <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <Image
                src="/logo.svg"
                alt="Jobflow"
                width={48}
                height={48}
                className="shrink-0"
              />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Job Search Automation
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Find Your Next{" "}
              <span className="text-primary">Opportunity</span>
            </h1>

            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mb-8">
              Automated job searching powered by AI. Upload your CV, let Claude analyze your profile,
              and discover matching opportunities across Swiss job boards.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="group" asChild>
                <Link href="/profile">
                  Get Started
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/jobs">View Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Demo Disclaimer */}
      <motion.section variants={itemVariants}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Demo Project</h3>
              <p className="text-sm text-muted-foreground">
                This is a personal demo project for exploring AI-powered job search automation.
                It requires your own API keys for{" "}
                <span className="font-medium text-foreground">Anthropic Claude</span> (CV extraction) and{" "}
                <span className="font-medium text-foreground">Firecrawl</span> (job scraping).
                Configure them in your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env.local</code> file.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How It Works */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">How It Works</h2>
          <p className="text-muted-foreground">
            Four steps from CV upload to matched job listings
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <Card key={step.title} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <div className="flex size-7 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
              {index < workflowSteps.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden lg:block">
                  <ArrowRight className="size-4 text-muted-foreground/50" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Key Features</h2>
          <p className="text-muted-foreground">
            Built with modern AI tools and job board integrations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section variants={itemVariants}>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Next.js 16",
                "TypeScript",
                "Tailwind CSS",
                "shadcn/ui",
                "Framer Motion",
                "Claude AI",
                "Firecrawl API",
                "Server-Sent Events",
              ].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
