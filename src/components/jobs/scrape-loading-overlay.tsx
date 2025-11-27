"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Database, Sparkles, CheckCircle, Globe, AlertCircle, XCircle, Brain, PartyPopper, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Custom styles for pulse animation
const pulseStyles = `
@keyframes pulse-scale {
  from {
    transform: scale3d(1, 1, 1);
  }
  50% {
    transform: scale3d(1.15, 1.15, 1.15);
  }
  to {
    transform: scale3d(1, 1, 1);
  }
}

.animate-pulse-scale {
  animation: pulse-scale 1.5s ease-in-out infinite;
}
`;

// Task type from the SSE events
interface ScrapeTask {
  id: string;
  board: string;
  query: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  jobsFound: number;
  error?: string;
}

interface ScrapePlanStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  mode: "full" | "quick";
  tasks: ScrapeTask[];
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  totalJobsFound: number;
  newJobsAdded: number;
  duplicatesSkipped: number;
}

interface MatchingProgress {
  phase: "matching_started" | "matching_progress" | "matching_complete";
  totalJobs: number;
  matchedJobs: number;
  useAI: boolean;
}

interface ScrapeLoadingOverlayProps {
  isVisible: boolean;
  mode: "full" | "quick";
  plan: ScrapePlanStatus | null;
  jobsFoundSoFar: number;
  matchingProgress?: MatchingProgress | null;
  isComplete?: boolean;
}

// Board icons/names mapping
const BOARD_DISPLAY_NAMES: Record<string, string> = {
  swissdevjobs: "SwissDevJobs",
  "jobs.ch": "Jobs.ch",
  jobsch: "Jobs.ch",
  datacareer: "Datacareer.ch",
  "datacareer.ch": "Datacareer.ch",
  ictjobs: "ICTjobs.ch",
  "ictjobs.ch": "ICTjobs.ch",
  indeed: "Indeed CH",
  "indeed.ch": "Indeed CH",
  glassdoor: "Glassdoor",
  linkedin: "LinkedIn",
  jobup: "Jobup.ch",
  "jobup.ch": "Jobup.ch",
  jobscout24: "Jobscout24.ch",
  "jobscout24.ch": "Jobscout24.ch",
};

function getBoardDisplayName(board: string): string {
  return BOARD_DISPLAY_NAMES[board.toLowerCase()] || board;
}

export function ScrapeLoadingOverlay({ isVisible, mode, plan, jobsFoundSoFar, matchingProgress, isComplete }: ScrapeLoadingOverlayProps) {
  const taskListRef = useRef<HTMLDivElement>(null);
  const runningTaskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [simulatedMatchProgress, setSimulatedMatchProgress] = useState(0);
  const matchingStartTimeRef = useRef<number | null>(null);

  // Calculate progress from real task data
  const tasks = plan?.tasks || [];
  const runningTasks = tasks.filter((t) => t.status === "running");

  // Auto-scroll to running tasks
  useEffect(() => {
    if (runningTasks.length > 0 && taskListRef.current) {
      const firstRunningTask = runningTasks[0];
      const taskElement = runningTaskRefs.current.get(firstRunningTask.id);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [runningTasks]);

  // Simulate progress during AI matching phase
  useEffect(() => {
    const isMatchingStarted = matchingProgress?.phase === "matching_started";
    const isMatchingInProgress = matchingProgress && matchingProgress.phase !== "matching_complete" && !isComplete;

    if (isMatchingStarted && !matchingStartTimeRef.current) {
      // Start simulating progress
      matchingStartTimeRef.current = Date.now();
      setSimulatedMatchProgress(0);
    }

    if (isMatchingInProgress) {
      // Simulate progress that slows down as it approaches 90%
      // This gives a realistic feel while waiting for actual completion
      const interval = setInterval(() => {
        setSimulatedMatchProgress((prev) => {
          // Asymptotic approach to 90% - never quite gets there
          // Progress slows down as it gets higher
          const remaining = 90 - prev;
          const increment = remaining * 0.08; // Move 8% of remaining distance
          return Math.min(prev + increment, 89);
        });
      }, 500);

      return () => clearInterval(interval);
    }

    if (matchingProgress?.phase === "matching_complete" || isComplete) {
      // Snap to 100% when complete
      setSimulatedMatchProgress(100);
      matchingStartTimeRef.current = null;
    }
  }, [matchingProgress, isComplete]);

  if (!isVisible) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const failedTasks = tasks.filter((t) => t.status === "failed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  // Determine current phase
  const isCreatingPlan = !plan || plan.status === "pending";
  const isScraping = !isCreatingPlan && !matchingProgress && !isComplete;
  const isMatching = matchingProgress && !isComplete;
  const allScrapingDone = totalTasks > 0 && pendingTasks.length === 0 && runningTasks.length === 0;

  // Progress calculation: scraping is 0-70%, matching is 70-100%
  let progress = 0;
  if (isComplete) {
    progress = 100;
  } else if (isMatching) {
    // Matching phase: 70% + (30% * simulated progress)
    // Use simulated progress for smooth animation during AI matching
    progress = 70 + (simulatedMatchProgress / 100) * 30;
  } else if (totalTasks > 0) {
    // Scraping phase: 0-70%
    progress = ((completedTasks + failedTasks) / totalTasks) * 70;
  }

  // Determine header content
  let headerIcon = <Search className="w-8 h-8 text-primary animate-pulse" />;
  let headerTitle = "Finding Your Perfect Jobs";
  let headerSubtitle = `${mode === "quick" ? "Quick search" : "Full search"} across top Swiss job boards`;

  if (isComplete) {
    headerIcon = <PartyPopper className="w-8 h-8 text-green-500" />;
    headerTitle = "Search Complete!";
    headerSubtitle = `Found ${jobsFoundSoFar} jobs matched to your profile`;
  } else if (isMatching) {
    headerIcon = <Brain className="w-8 h-8 text-purple-500 animate-pulse" />;
    headerTitle = matchingProgress.useAI ? "AI Analyzing Jobs" : "Scoring Jobs";
    headerSubtitle = matchingProgress.useAI
      ? "Using AI to find your best matches..."
      : "Calculating match scores...";
  }

  return (
    <>
      {/* Inject custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />

      <div className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300",
        isComplete && "bg-background/98"
      )}>
      <div className={cn(
        "w-full max-w-lg mx-4 space-y-8 transition-transform duration-300",
        isComplete && "scale-105"
      )}>
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={cn(
            "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300",
            isComplete ? "bg-green-500/20" : isMatching ? "bg-purple-500/10" : "bg-primary/10"
          )}>
            {headerIcon}
          </div>
          <h2 className="text-2xl font-bold">{headerTitle}</h2>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>

        {/* Main Progress */}
        <div className="space-y-3">
          <Progress
            value={progress}
            className={cn(
              "h-3 transition-all duration-300",
              isComplete && "[&>div]:bg-green-500",
              isMatching && "[&>div]:bg-purple-500"
            )}
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isComplete
                ? "Loading your results..."
                : isMatching
                ? `AI analyzing ${matchingProgress?.totalJobs || 0} jobs...`
                : isCreatingPlan
                ? "Creating search plan..."
                : `${completedTasks + failedTasks} of ${totalTasks} sources searched`}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* AI Matching Phase */}
        {isMatching && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-purple-600 dark:text-purple-400">
                  {matchingProgress?.useAI ? "AI-Powered Analysis" : "Scoring Jobs"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {matchingProgress?.phase === "matching_started"
                    ? "Preparing job analysis..."
                    : matchingProgress?.phase === "matching_complete"
                    ? "Analysis complete!"
                    : `Analyzing ${matchingProgress?.totalJobs || 0} jobs against your profile...`}
                </p>
              </div>
            </div>

            {/* Matching Progress Bar */}
            <div className="space-y-2">
              <Progress
                value={simulatedMatchProgress}
                className="h-2 [&>div]:bg-purple-500 [&>div]:transition-all [&>div]:duration-500"
              />
              <div className="flex justify-between text-xs text-purple-600/70 dark:text-purple-400/70">
                <span>
                  {simulatedMatchProgress < 30
                    ? "Reading job descriptions..."
                    : simulatedMatchProgress < 60
                    ? "Matching skills & requirements..."
                    : simulatedMatchProgress < 85
                    ? "Calculating compatibility scores..."
                    : simulatedMatchProgress < 100
                    ? "Finalizing rankings..."
                    : "Complete!"}
                </span>
                <span>{Math.round(simulatedMatchProgress)}%</span>
              </div>
            </div>

            {matchingProgress?.useAI && (
              <div className="text-xs text-purple-600/70 dark:text-purple-400/70 flex items-center gap-2 pt-1">
                <Sparkles className="w-3 h-3" />
                Powered by Claude AI
              </div>
            )}
          </div>
        )}

        {/* Completion State */}
        {isComplete && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                {jobsFoundSoFar} Jobs Ready!
              </h3>
              <p className="text-sm text-muted-foreground">
                Opening your personalized job board...
              </p>
            </div>
          </div>
        )}

        {/* Current Running Tasks - only show during scraping phase */}
        {runningTasks.length > 0 && !isMatching && !isComplete && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary animate-pulse-scale" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">
                  {runningTasks.length === 1
                    ? `Searching ${getBoardDisplayName(runningTasks[0].board)}`
                    : `Searching ${runningTasks.length} sources`}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {runningTasks.map((t) => `${getBoardDisplayName(t.board)}: "${t.query}"`).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Creating plan state - only show at start */}
        {isCreatingPlan && !isMatching && !isComplete && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">Analyzing Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Creating personalized search queries based on your skills...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Found Counter - show during scraping, not during matching/complete */}
        {jobsFoundSoFar > 0 && !isMatching && !isComplete && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">{jobsFoundSoFar} jobs found so far</span>
            </div>
          </div>
        )}

        {/* Task List - only show during scraping phase */}
        {tasks.length > 0 && !isMatching && !isComplete && (
          <div className="relative">
            {/* Task list header with scroll hint */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-muted-foreground">
                Search Progress ({completedTasks + failedTasks}/{totalTasks})
              </span>
              {tasks.length > 4 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                  <ChevronDown className="w-3 h-3" />
                  Scroll for more
                </span>
              )}
            </div>

            {/* Scrollable task list */}
            <div
              ref={taskListRef}
              className="space-y-2 max-h-48 overflow-y-auto scroll-smooth rounded-lg border bg-card/50 p-2"
            >
              {tasks.map((task) => {
                const isCompleted = task.status === "completed";
                const isFailed = task.status === "failed";
                const isRunning = task.status === "running";
                const isPending = task.status === "pending";

                return (
                  <div
                    key={task.id}
                    ref={(el) => {
                      if (el) {
                        runningTaskRefs.current.set(task.id, el);
                      } else {
                        runningTaskRefs.current.delete(task.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-300",
                      isCompleted && "bg-green-500/10",
                      isFailed && "bg-red-500/10",
                      isRunning && "bg-primary/10 border-2 border-primary/40 shadow-sm shadow-primary/20",
                      isPending && "opacity-40"
                    )}
                  >
                    {/* Status Icon */}
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm",
                          isCompleted && "text-green-600",
                          isFailed && "text-red-600",
                          isRunning && "font-medium text-primary",
                          isPending && "text-muted-foreground"
                        )}
                      >
                        {getBoardDisplayName(task.board)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        &quot;{task.query}&quot;
                      </span>
                    </div>

                    {/* Jobs Found / Error */}
                    {isCompleted && task.jobsFound > 0 && (
                      <span className="text-xs text-green-600 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                        +{task.jobsFound}
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-xs text-red-500 truncate max-w-[120px]" title={task.error}>
                        {task.error?.includes("timed out") ? "Timeout" : "Failed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scroll gradient indicator at bottom */}
            {tasks.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none rounded-b-lg" />
            )}
          </div>
        )}

        {/* Failed Tasks Summary - only during scraping */}
        {failedTasks > 0 && !isMatching && !isComplete && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{failedTasks} task{failedTasks > 1 ? "s" : ""} failed (timeout or error)</span>
          </div>
        )}

        {/* Tip - context-aware */}
        {!isComplete && (
          <p className="text-xs text-center text-muted-foreground">
            {isMatching
              ? matchingProgress?.useAI
                ? "AI is evaluating each job against your skills and experience..."
                : "Calculating compatibility scores..."
              : pendingTasks.length > 0
              ? `${pendingTasks.length} more source${pendingTasks.length > 1 ? "s" : ""} to search...`
              : runningTasks.length > 0
              ? "Processing final searches..."
              : allScrapingDone
              ? "Preparing AI analysis..."
              : "Getting ready..."}
          </p>
        )}
      </div>
      </div>
    </>
  );
}
