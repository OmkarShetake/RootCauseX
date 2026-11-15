import React from 'react';
import { 
  TriagedIssue, 
  FilterState, 
  IssueCategory, 
  IssueSeverity 
} from '../types';
import { 
  Search, 
  CopyCheck, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  Bug,
  BookOpen,
  Zap
} from 'lucide-react';

interface TriageQueueTabProps {
  issues: TriagedIssue[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSelectIssue: (issue: TriagedIssue) => void;
  loading: boolean;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Categories', value: '' },
  { label: 'Bug', value: 'BUG' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Feature', value: 'FEATURE' },
  { label: 'Docs', value: 'DOCS' },
];

const SEVERITIES: { label: string; value: string }[] = [
  { label: 'All Severities', value: '' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

export const TriageQueueTab: React.FC<TriageQueueTabProps> = ({
  issues,
  filters,
  onFilterChange,
  onSelectIssue,
  loading,
}) => {

  const getCategoryBadge = (category: IssueCategory) => {
    switch (category) {
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> Security
          </span>
        );
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Bug className="w-3.5 h-3.5" /> Bug
          </span>
        );
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" /> Feature
          </span>
        );
      case 'DOCS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <BookOpen className="w-3.5 h-3.5" /> Docs
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            {category}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Controls & Filters Bar */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search issues by title or root-cause keyword..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>

        {/* Dropdowns & Toggle Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="px-3.5 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Severity Dropdown */}
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
            className="px-3.5 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Duplicates Only Button */}
          <button
            onClick={() => onFilterChange({ ...filters, duplicatesOnly: !filters.duplicatesOnly })}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
              filters.duplicatesOnly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <CopyCheck className="w-4 h-4" />
            <span>Duplicates</span>
          </button>

          {/* Good First Only Button */}
          <button
            onClick={() => onFilterChange({ ...filters, goodFirstOnly: !filters.goodFirstOnly })}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
              filters.goodFirstOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Good First</span>
          </button>
        </div>

      </div>

      {/* Issues Queue Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#121215] animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121215]">
          <Bug className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            No Triaged Issues Found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Click <strong>"Sync &amp; Analyze"</strong> in the top command bar to fetch open issues from GitHub and run the root-cause triage engine.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="group p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:border-emerald-500/50 hover:shadow-xl dark:hover:shadow-emerald-950/20 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                
                {/* Left content */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      #{issue.issueNumber}
                    </span>
                    {getCategoryBadge(issue.category)}
                    {getSeverityBadge(issue.severity)}
                    
                    {issue.isDuplicate && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <CopyCheck className="w-3.5 h-3.5" /> Duplicate of #{issue.duplicateIssueNumber ?? 'past'} ({Math.round(issue.similarityScore * 100)}% match)
                      </span>
                    )}

                    {issue.isGoodFirstIssue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-3.5 h-3.5" /> Good First Issue
                      </span>
                    )}

                    {issue.component && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {issue.component}
                      </span>
                    )}

                    {issue.confidenceScore !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                        issue.confidenceScore >= 0.75
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : issue.confidenceScore >= 0.50
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {Math.round(issue.confidenceScore * 100)}% conf
                      </span>
                    )}
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-500 transition line-clamp-1 leading-snug">
                    {issue.title}
                  </h4>

                  <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    <strong className="text-zinc-400 dark:text-zinc-300 font-semibold">Diagnosis:</strong> {issue.rootCauseHint}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400 font-medium">
                    <span>Opened by <strong className="text-zinc-300">{issue.author}</strong></span>
                    <span>•</span>
                    <span>{new Date(issue.githubCreatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right Arrow Action */}
                <div className="flex items-center gap-1.5 self-center text-zinc-400 group-hover:text-emerald-500 transition">
                  <span className="text-sm font-semibold hidden sm:inline">Inspect</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
