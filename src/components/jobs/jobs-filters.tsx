"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { JobFilters } from "@/types/jobs";

interface JobsFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  sources?: string[];
}

export function JobsFilters({
  filters,
  onFiltersChange,
  sources = [],
}: JobsFiltersProps) {
  const [searchText, setSearchText] = useState(filters.searchText || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchText });
  };

  const handleFilterChange = (key: keyof JobFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setSearchText("");
    onFiltersChange({});
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== "" &&
      (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Min Score */}
        <Select
          value={filters.minScore?.toString() || "all"}
          onValueChange={(value) =>
            handleFilterChange(
              "minScore",
              value === "all" ? undefined : parseInt(value, 10)
            )
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Match Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="90">90%+ Excellent</SelectItem>
            <SelectItem value="70">70%+ Good</SelectItem>
            <SelectItem value="50">50%+ Fair</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.statuses?.join(",") || "active"}
          onValueChange={(value) =>
            handleFilterChange(
              "statuses",
              value === "active"
                ? ["new", "viewed", "saved"]
                : value === "all"
                  ? undefined
                  : [value]
            )
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Posted */}
        <Select
          value={filters.datePosted || "any"}
          onValueChange={(value) =>
            handleFilterChange(
              "datePosted",
              value === "any" ? undefined : value
            )
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Date Posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Remote Toggle */}
        <Button
          variant={filters.remoteOnly ? "default" : "outline"}
          size="sm"
          onClick={() =>
            handleFilterChange("remoteOnly", !filters.remoteOnly)
          }
        >
          Remote Only
        </Button>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Advanced Filters</h4>

              {/* Company Size */}
              <div className="space-y-2">
                <Label>Company Size</Label>
                <div className="flex flex-wrap gap-2">
                  {["startup", "small", "medium", "large", "enterprise"].map(
                    (size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`size-${size}`}
                          checked={filters.companySizes?.includes(
                            size as NonNullable<JobFilters["companySizes"]>[number]
                          )}
                          onCheckedChange={(checked) => {
                            const current = filters.companySizes || [];
                            const updated = checked
                              ? [...current, size as NonNullable<JobFilters["companySizes"]>[number]]
                              : current.filter((s) => s !== size);
                            handleFilterChange(
                              "companySizes",
                              updated.length > 0 ? updated : undefined
                            );
                          }}
                        />
                        <Label
                          htmlFor={`size-${size}`}
                          className="text-sm capitalize"
                        >
                          {size}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Seniority Level */}
              <div className="space-y-2">
                <Label>Seniority Level</Label>
                <div className="flex flex-wrap gap-2">
                  {["entry", "junior", "mid", "senior", "lead"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`seniority-${level}`}
                        checked={filters.seniorityLevels?.includes(
                          level as NonNullable<JobFilters["seniorityLevels"]>[number]
                        )}
                        onCheckedChange={(checked) => {
                          const current = filters.seniorityLevels || [];
                          const updated = checked
                            ? [...current, level as NonNullable<JobFilters["seniorityLevels"]>[number]]
                            : current.filter((s) => s !== level);
                          handleFilterChange(
                            "seniorityLevels",
                            updated.length > 0 ? updated : undefined
                          );
                        }}
                      />
                      <Label
                        htmlFor={`seniority-${level}`}
                        className="text-sm capitalize"
                      >
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  <Label>Sources</Label>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source}`}
                          checked={filters.sources?.includes(source)}
                          onCheckedChange={(checked) => {
                            const current = filters.sources || [];
                            const updated = checked
                              ? [...current, source]
                              : current.filter((s) => s !== source);
                            handleFilterChange(
                              "sources",
                              updated.length > 0 ? updated : undefined
                            );
                          }}
                        />
                        <Label htmlFor={`source-${source}`} className="text-sm">
                          {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
