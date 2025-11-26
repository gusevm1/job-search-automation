"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Clock,
  Briefcase,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchScoreBadge } from "./match-score-badge";
import type { EnhancedJobListing, JobStatus } from "@/types/jobs";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: EnhancedJobListing;
  onStatusChange?: (jobId: string, status: JobStatus) => void;
  className?: string;
}

export function JobCard({ job, onStatusChange, className }: JobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (isUpdating || !onStatusChange) return;
    setIsUpdating(true);
    try {
      await onStatusChange(job.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getCompanySizeLabel = (size?: string) => {
    const labels: Record<string, string> = {
      startup: "Startup",
      small: "Small (1-50)",
      medium: "Medium (51-200)",
      large: "Large (201-1000)",
      enterprise: "Enterprise (1000+)",
    };
    return size ? labels[size] || size : null;
  };

  const isHidden = job.status === "hidden";
  const isSaved = job.status === "saved";
  const isApplied = job.status === "applied";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isHidden && "opacity-50",
        isApplied && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {job.matchScore !== undefined && (
                <MatchScoreBadge score={job.matchScore} size="sm" />
              )}
              {job.seniorityLevel && (
                <Badge variant="outline" className="text-xs capitalize">
                  {job.seniorityLevel}
                </Badge>
              )}
              {job.remote === "remote" && (
                <Badge variant="secondary" className="text-xs">
                  Remote
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {job.company}
              {job.companySize && (
                <span className="text-muted-foreground">
                  · {getCompanySizeLabel(job.companySize)}
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isSaved && "text-yellow-500")}
              onClick={() =>
                handleStatusChange(isSaved ? "new" : "saved")
              }
              disabled={isUpdating}
              title={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                handleStatusChange(isHidden ? "new" : "hidden")
              }
              disabled={isUpdating}
              title={isHidden ? "Unhide" : "Hide"}
            >
              {isHidden ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Location & Type */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.employmentType && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.employmentType}
            </span>
          )}
          {job.postedDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(job.postedDate)}
            </span>
          )}
        </div>

        {/* Tech Stack */}
        {job.techStack && job.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.techStack.slice(0, 6).map((tech, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {job.techStack.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{job.techStack.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Description preview */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description.slice(0, 200)}...
          </p>
        )}

        {/* Source & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            via {job.sourceSite}
          </span>
          <div className="flex items-center gap-2">
            {isApplied ? (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("applied")}
                disabled={isUpdating}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Applied
              </Button>
            )}
            {job.applicationUrl && (
              <Button variant="default" size="sm" asChild>
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
