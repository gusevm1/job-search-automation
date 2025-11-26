"use client";

import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

interface ScrapeProgressProps {
  plan: ScrapePlanStatus;
}

export function ScrapeProgress({ plan }: ScrapeProgressProps) {
  const progress =
    plan.tasksTotal > 0
      ? Math.round(
          ((plan.tasksCompleted + plan.tasksFailed) / plan.tasksTotal) * 100
        )
      : 0;

  const isComplete = plan.status === "completed" || plan.status === "failed";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {isComplete ? "Scrape Complete" : "Finding Jobs..."}
            </CardTitle>
            <CardDescription>
              {plan.mode === "quick" ? "Quick search" : "Full search"} across{" "}
              {plan.tasksTotal} queries
            </CardDescription>
          </div>
          {!isComplete && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {plan.status === "completed" && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {plan.status === "failed" && (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {plan.tasksCompleted} of {plan.tasksTotal} completed
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Stats */}
        {isComplete && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {plan.newJobsAdded}
              </div>
              <div className="text-xs text-muted-foreground">New Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{plan.totalJobsFound}</div>
              <div className="text-xs text-muted-foreground">Total Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {plan.duplicatesSkipped}
              </div>
              <div className="text-xs text-muted-foreground">Duplicates</div>
            </div>
          </div>
        )}

        {/* Task List (collapsed for completed) */}
        {!isComplete && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {plan.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm py-1"
              >
                {task.status === "pending" && (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                {task.status === "running" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {task.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {task.status === "failed" && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="flex-1 truncate">
                  <span className="font-medium">{task.board}</span>
                  <span className="text-muted-foreground"> · {task.query}</span>
                </span>
                {task.status === "completed" && (
                  <span className="text-xs text-muted-foreground">
                    {task.jobsFound} jobs
                  </span>
                )}
                {task.status === "failed" && (
                  <span className="text-xs text-destructive">Failed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
