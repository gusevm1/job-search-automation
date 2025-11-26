"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Loader2,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Globe,
  Database,
  TrendingUp,
  Calendar,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JobsFilters } from "@/components/jobs/jobs-filters";
import { ScrapeProgress } from "@/components/jobs/scrape-progress";
import { ScrapeLoadingOverlay } from "@/components/jobs/scrape-loading-overlay";
import { MatchScoreBadge } from "@/components/jobs/match-score-badge";
import { Badge } from "@/components/ui/badge";
import type { EnhancedJobListing, JobFilters, JobStatus } from "@/types/jobs";

interface JobStats {
  total: number;
  new: number;
  saved: number;
  applied: number;
  hidden: number;
  viewed: number;
  averageScore: number;
  bySource: Record<string, number>;
  lastScrapedAt: string | null;
}

interface ScrapePlanStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  mode: "full" | "quick";
  tasks: Array<{
    id: string;
    board: string;
    query: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    jobsFound: number;
    error?: string;
  }>;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  totalJobsFound: number;
  newJobsAdded: number;
  duplicatesSkipped: number;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<EnhancedJobListing[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [filters, setFilters] = useState<JobFilters>({
    statuses: ["new", "viewed", "saved"],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMode, setScrapeMode] = useState<"full" | "quick">("full");
  const [scrapePlan, setScrapePlan] = useState<ScrapePlanStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobsFoundSoFar, setJobsFoundSoFar] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const JOBS_PER_PAGE = 20;

  // Load user profile to get userId
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile/load");
        const data = await response.json();
        if (data.success && data.profile) {
          setUserId(data.userId || data.profile.id);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setHasProfile(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Load jobs when userId is available
  const loadJobs = useCallback(async (page = 1, append = false) => {
    if (!userId) return;

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setCurrentPage(1);
      }

      const params = new URLSearchParams({ userId });
      params.set("page", page.toString());
      params.set("limit", JOBS_PER_PAGE.toString());

      // Add filters to query params
      if (filters.minScore) params.set("minScore", filters.minScore.toString());
      if (filters.sources?.length)
        params.set("sources", filters.sources.join(","));
      if (filters.statuses?.length)
        params.set("statuses", filters.statuses.join(","));
      if (filters.remoteOnly) params.set("remoteOnly", "true");
      if (filters.datePosted) params.set("datePosted", filters.datePosted);
      if (filters.searchText) params.set("searchText", filters.searchText);
      if (filters.seniorityLevels?.length)
        params.set("seniorityLevels", filters.seniorityLevels.join(","));
      if (filters.companySizes?.length)
        params.set("companySizes", filters.companySizes.join(","));

      const response = await fetch(`/api/jobs/list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setJobs((prev) => [...prev, ...data.jobs]);
        } else {
          setJobs(data.jobs);
        }
        setStats(data.stats);
        setCurrentPage(page);
        setTotalPages(data.pagination?.totalPages || 1);
        setError(null);
      } else {
        setError(data.message || "Failed to load jobs");
      }
    } catch (err) {
      setError("Failed to load jobs");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId, filters]);

  // Load more jobs (next page)
  const loadMoreJobs = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      loadJobs(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (userId) {
      loadJobs();
    }
  }, [userId, loadJobs]);

  // Handle job status update
  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status } : job
          )
        );
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
    }
  };

  // Trigger scrape using SSE for real-time progress
  const handleScrape = (mode: "full" | "quick" = "full") => {
    if (!userId) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsScraping(true);
    setScrapeMode(mode);
    setError(null);
    setScrapePlan(null);
    setJobsFoundSoFar(0);

    // Create SSE connection
    const eventSource = new EventSource(
      `/api/jobs/scrape/stream?userId=${encodeURIComponent(userId)}&mode=${mode}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "plan_created":
            // Plan is being created
            console.log("[SSE] Plan creation started");
            break;

          case "plan_ready":
          case "progress":
            // Update plan state with real data
            if (data.plan) {
              setScrapePlan({
                ...data.plan,
                tasksTotal: data.plan.tasks?.length || 0,
                tasksCompleted: data.plan.tasks?.filter((t: { status: string }) => t.status === "completed").length || 0,
                tasksFailed: data.plan.tasks?.filter((t: { status: string }) => t.status === "failed").length || 0,
              });
            }
            // Update jobs found counter
            if (typeof data.jobsFoundSoFar === "number") {
              setJobsFoundSoFar(data.jobsFoundSoFar);
            }
            break;

          case "complete":
            console.log("[SSE] Scrape complete:", data);
            if (data.plan) {
              setScrapePlan({
                ...data.plan,
                tasksTotal: data.plan.tasks?.length || 0,
                tasksCompleted: data.plan.tasks?.filter((t: { status: string }) => t.status === "completed").length || 0,
                tasksFailed: data.plan.tasks?.filter((t: { status: string }) => t.status === "failed").length || 0,
              });
            }
            setJobsFoundSoFar(data.totalJobsFound || 0);
            eventSource.close();
            setIsScraping(false);
            loadJobs(); // Refresh job list
            break;

          case "error":
            console.error("[SSE] Error:", data.message);
            setError(data.message || "Scrape failed");
            eventSource.close();
            setIsScraping(false);
            break;
        }
      } catch (parseError) {
        console.error("[SSE] Failed to parse event:", parseError);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
      setError("Connection lost. Please try again.");
      eventSource.close();
      setIsScraping(false);
    };
  };

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Get unique sources for filter
  const sources = stats?.bySource ? Object.keys(stats.bySource) : [];

  // No profile state
  if (!hasProfile && !isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Find jobs that match your profile
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
          <p className="text-muted-foreground mb-4">
            Upload your CV to get personalized job recommendations.
          </p>
          <Button asChild>
            <a href="/profile">Go to Profile</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      <ScrapeLoadingOverlay
        isVisible={isScraping}
        mode={scrapeMode}
        plan={scrapePlan}
        jobsFoundSoFar={jobsFoundSoFar}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            {stats?.total
              ? `${stats.total} jobs found • ${stats.new} new`
              : "Find jobs that match your profile"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleScrape("quick")}
            disabled={isScraping || isLoading}
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Quick Search
              </>
            )}
          </Button>
          <Button
            onClick={() => handleScrape("full")}
            disabled={isScraping || isLoading}
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Find Jobs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="rounded-lg border bg-card p-4 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{stats.new}</span>
              </div>
              <div className="text-sm text-muted-foreground">New</div>
            </div>
            <div className="rounded-lg border bg-card p-4 border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.saved}
              </div>
              <div className="text-sm text-muted-foreground">Saved</div>
            </div>
            <div className="rounded-lg border bg-card p-4 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-600">
                {stats.applied}
              </div>
              <div className="text-sm text-muted-foreground">Applied</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.averageScore}%</span>
              </div>
              <div className="text-sm text-muted-foreground">Avg Match</div>
            </div>
          </div>

          {/* Source Breakdown */}
          {Object.keys(stats.bySource).length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Jobs by Source</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.bySource)
                  .sort(([, a], [, b]) => b - a)
                  .map(([source, count]) => (
                    <Badge
                      key={source}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {source}
                      <span className="ml-2 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-bold">
                        {count}
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Last Scraped */}
          {stats.lastScrapedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: {new Date(stats.lastScrapedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Scrape Progress */}
      {scrapePlan && scrapePlan.status !== "completed" && (
        <ScrapeProgress plan={scrapePlan} />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <JobsFilters
        filters={filters}
        onFiltersChange={setFilters}
        sources={sources}
      />

      {/* Jobs List with Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 && stats?.total === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground mb-4">
            Click &apos;Find Jobs&apos; to search for positions matching your profile.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We&apos;ll search across multiple job boards:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">SwissDevJobs</Badge>
              <Badge variant="outline">Jobs.ch</Badge>
              <Badge variant="outline">Datacareer.ch</Badge>
              <Badge variant="outline">ICTjobs.ch</Badge>
              <Badge variant="outline">Indeed CH</Badge>
              <Badge variant="outline">Glassdoor</Badge>
            </div>
            <Button onClick={() => handleScrape("full")} disabled={isScraping} className="mt-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Find Jobs
            </Button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Matching Jobs</h3>
          <p className="text-muted-foreground mb-4">
            No jobs match your current filters. Try adjusting them or search for new jobs.
          </p>
          <Button variant="outline" onClick={() => setFilters({ statuses: ["new", "viewed", "saved"] })}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {jobs.length} of {stats?.total || 0} jobs
            </p>
          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={loadMoreJobs}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Jobs ({jobs.length} of {stats?.total || 0})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
