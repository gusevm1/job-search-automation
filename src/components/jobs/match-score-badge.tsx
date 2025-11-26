"use client";

import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MatchScoreBadge({
  score,
  size = "md",
  showLabel = true,
  className,
}: MatchScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (score >= 70) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (score >= 50) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Low";
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      <span className="font-bold">{score}%</span>
      {showLabel && <span className="hidden sm:inline">· {getScoreLabel(score)}</span>}
    </div>
  );
}
