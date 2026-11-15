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
  Zap,
  FlaskConical
} from 'lucide-react';

interface TriageQueueTabProps {
  issues: TriagedIssue[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSelectIssue: (issue: TriagedIssue) => void;
  loading: boolean;
  onLoadDemo?: () => void;
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
  onLoadDemo,
}) => {

  const getCategoryBadge = (category: IssueCategory) => {
    switch (category) {
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#B94A48]/10 text-[#B94A48] dark:text-[#E06A68] border border-[#B94A48]/25">
            <ShieldAlert className="w-3 h-3" /> Security
          </span>
        );
      case 'BUG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#E98245]/10 text-[#E98245] dark:text-[#F0955E] border border-[#E98245]/25">
            <Bug className="w-3 h-3" /> Bug
          </span>
        );
      case 'FEATURE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] border border-[#7654C8]/25">
            <Zap className="w-3 h-3" /> Feature
          </span>
        );
      case 'DOCS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#77727C]/10 text-[#77727C] dark:text-[#9E98A6] border border-[#77727C]/25">
            <BookOpen className="w-3 h-3" /> Docs
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36]">
            {category}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#B94A48]/15 text-[#B94A48] dark:text-[#E06A68] border border-[#B94A48]/30">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#C69A35]/15 text-[#C69A35] dark:text-[#E0B654] border border-[#C69A35]/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36]">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#EFEBE5]/60 dark:bg-[#282630]/60 text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36]">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* Controls & Filters Bar */}
      <div className="p-3.5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#77727C] absolute left-3 top-3" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search issues by title, component, or diagnosis..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] placeholder-[#9E98A6] focus:outline-none focus:ring-1 focus:ring-[#7654C8] focus:border-[#7654C8]"
          />
        </div>

        {/* Dropdowns & Toggle Badges */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="px-2.5 py-1.5 text-xs bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] focus:outline-none focus:border-[#7654C8] font-medium cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Severity Dropdown */}
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
            className="px-2.5 py-1.5 text-xs bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] focus:outline-none focus:border-[#7654C8] font-medium cursor-pointer"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Duplicates Only Button (Warm Orange Accent) */}
          <button
            onClick={() => onFilterChange({ ...filters, duplicatesOnly: !filters.duplicatesOnly })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              filters.duplicatesOnly
                ? 'bg-[#E98245]/15 text-[#E98245] dark:text-[#F0955E] border-[#E98245]/40 font-semibold'
                : 'bg-[#F5F2ED] dark:bg-[#16151A] text-[#77727C] dark:text-[#9E98A6] border-[#E8E3DC] dark:border-[#2E2C36] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
            }`}
          >
            <CopyCheck className="w-3.5 h-3.5" />
            <span>Duplicates</span>
          </button>

          {/* Good First Only Button (Violet Accent) */}
          <button
            onClick={() => onFilterChange({ ...filters, goodFirstOnly: !filters.goodFirstOnly })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              filters.goodFirstOnly
                ? 'bg-[#7654C8]/15 text-[#7654C8] dark:text-[#916FE0] border-[#7654C8]/40 font-semibold'
                : 'bg-[#F5F2ED] dark:bg-[#16151A] text-[#77727C] dark:text-[#9E98A6] border-[#E8E3DC] dark:border-[#2E2C36] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Good First</span>
          </button>
        </div>

      </div>

      {/* Issues Queue Cards */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 p-6">
          <Bug className="w-8 h-8 text-[#77727C] mx-auto opacity-60" />
          <h3 className="text-base font-bold text-[#25242B] dark:text-[#F5F2ED]">
            No Triaged Issues Found
          </h3>
          <p className="text-xs text-[#77727C] dark:text-[#9E98A6] max-w-md mx-auto leading-relaxed">
            GitHub API unauthenticated access may be rate-limited on shared hosting. Click <strong>"Sync &amp; Analyze"</strong> above with a token, or load the verified demo showcase fixtures.
          </p>
          {onLoadDemo && (
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E98245] hover:bg-[#D47236] text-white text-xs font-semibold shadow-xs transition active:scale-98 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Load Verified Showcase Data</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="group p-4 sm:p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] hover:border-[#7654C8]/50 dark:hover:border-[#916FE0]/50 transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                
                {/* Left content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-xs text-[#25242B] dark:text-[#F5F2ED] bg-[#EFEBE5] dark:bg-[#282630] px-2 py-0.5 rounded border border-[#E8E3DC] dark:border-[#2E2C36]">
                      #{issue.issueNumber}
                    </span>
                    {getCategoryBadge(issue.category)}
                    {getSeverityBadge(issue.severity)}
                    
                    {issue.isDuplicate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#E98245]/15 text-[#E98245] dark:text-[#F0955E] border border-[#E98245]/30">
                        <CopyCheck className="w-3 h-3" /> Duplicate of #{issue.duplicateIssueNumber ?? 'past'} ({Math.round(issue.similarityScore * 100)}% match)
                      </span>
                    )}

                    {issue.isGoodFirstIssue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] border border-[#7654C8]/25">
                        <Sparkles className="w-3 h-3" /> Good First Issue
                      </span>
                    )}

                    {issue.component && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36]">
                        {issue.component}
                      </span>
                    )}

                    {issue.confidenceScore !== undefined && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium text-[#77727C] dark:text-[#9E98A6] bg-[#EFEBE5]/60 dark:bg-[#282630]/60">
                        {Math.round(issue.confidenceScore * 100)}% conf
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-[#25242B] dark:text-[#F5F2ED] group-hover:text-[#7654C8] dark:group-hover:text-[#916FE0] transition line-clamp-1 leading-snug">
                    {issue.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#77727C] dark:text-[#9E98A6] line-clamp-2 leading-relaxed">
                    <strong className="text-[#25242B] dark:text-[#F5F2ED] font-semibold">Diagnosis:</strong> {issue.rootCauseHint}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5 text-xs text-[#9E98A6] font-mono">
                    <span>opened by {issue.author}</span>
                    <span>•</span>
                    <span>{new Date(issue.githubCreatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right Arrow Action */}
                <div className="flex items-center gap-1 self-center text-[#77727C] group-hover:text-[#7654C8] dark:group-hover:text-[#916FE0] transition shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
