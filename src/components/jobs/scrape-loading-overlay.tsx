"use client";

import { Loader2, Search, Database, Sparkles, CheckCircle, Globe, AlertCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

interface ScrapeLoadingOverlayProps {
  isVisible: boolean;
  mode: "full" | "quick";
  plan: ScrapePlanStatus | null;
  jobsFoundSoFar: number;
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
};

function getBoardDisplayName(board: string): string {
  return BOARD_DISPLAY_NAMES[board.toLowerCase()] || board;
}

export function ScrapeLoadingOverlay({ isVisible, mode, plan, jobsFoundSoFar }: ScrapeLoadingOverlayProps) {
  if (!isVisible) return null;

  // Calculate progress from real task data
  const tasks = plan?.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const failedTasks = tasks.filter((t) => t.status === "failed").length;
  const runningTasks = tasks.filter((t) => t.status === "running");
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  // Progress percentage (completed + failed / total)
  const progress = totalTasks > 0 ? ((completedTasks + failedTasks) / totalTasks) * 100 : 0;

  // Waiting for plan to be created
  const isCreatingPlan = !plan || plan.status === "pending";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-lg mx-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">Finding Your Perfect Jobs</h2>
          <p className="text-muted-foreground">
            {mode === "quick" ? "Quick search" : "Full search"} across top Swiss job boards
          </p>
        </div>

        {/* Main Progress */}
        <div className="space-y-3">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isCreatingPlan
                ? "Creating search plan..."
                : `${completedTasks + failedTasks} of ${totalTasks} tasks completed`}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Current Running Tasks */}
        {runningTasks.length > 0 && (
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary animate-spin" />
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

        {/* Creating plan state */}
        {isCreatingPlan && (
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

        {/* Jobs Found Counter */}
        {jobsFoundSoFar > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">{jobsFoundSoFar} jobs found so far</span>
            </div>
          </div>
        )}

        {/* Task List */}
        {tasks.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isFailed = task.status === "failed";
              const isRunning = task.status === "running";
              const isPending = task.status === "pending";

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 py-2 px-3 rounded-md transition-colors",
                    isCompleted && "bg-green-500/5",
                    isFailed && "bg-red-500/5",
                    isRunning && "bg-primary/5 border border-primary/20",
                    isPending && "opacity-50"
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
                    <span className="text-xs text-green-600 font-medium">
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
        )}

        {/* Failed Tasks Summary */}
        {failedTasks > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{failedTasks} task{failedTasks > 1 ? "s" : ""} failed (timeout or error)</span>
          </div>
        )}

        {/* Tip */}
        <p className="text-xs text-center text-muted-foreground">
          {pendingTasks.length > 0
            ? `${pendingTasks.length} more task${pendingTasks.length > 1 ? "s" : ""} waiting...`
            : runningTasks.length > 0
            ? "Processing final searches..."
            : "Almost done!"}
        </p>
      </div>
    </div>
  );
}
