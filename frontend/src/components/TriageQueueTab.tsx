import React from 'react';
import { TriagedIssue, FilterState, IssueCategory, IssueSeverity } from '../types';
import {
  Search,
  CopyCheck,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Bug,
  BookOpen,
  Zap,
  FlaskConical,
} from 'lucide-react';

interface TriageQueueTabProps {
  issues: TriagedIssue[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSelectIssue: (issue: TriagedIssue) => void;
  loading: boolean;
  onLoadDemo?: () => void;
}

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Bug', value: 'BUG' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Feature', value: 'FEATURE' },
  { label: 'Docs', value: 'DOCS' },
];

const SEVERITIES = [
  { label: 'All Severities', value: '' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

const getCategoryBadge = (category: IssueCategory) => {
  const styles: Record<IssueCategory, { bg: string; color: string; border: string; Icon: React.FC<{ className?: string }> }> = {
    SECURITY: { bg: 'rgba(185,74,72,0.08)', color: '#B94A48', border: 'rgba(185,74,72,0.22)', Icon: ({ className }) => <ShieldAlert className={className} /> },
    BUG: { bg: 'rgba(233,130,69,0.08)', color: '#E98245', border: 'rgba(233,130,69,0.22)', Icon: ({ className }) => <Bug className={className} /> },
    FEATURE: { bg: 'rgba(118,84,200,0.08)', color: '#7654C8', border: 'rgba(118,84,200,0.22)', Icon: ({ className }) => <Zap className={className} /> },
    DOCS: { bg: 'rgba(119,114,124,0.08)', color: '#77727C', border: 'rgba(119,114,124,0.22)', Icon: ({ className }) => <BookOpen className={className} /> },
  };
  const s = styles[category];
  if (!s) return <span className="px-2 py-0.5 rounded text-[11px] font-semibold"
    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{category}</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <s.Icon className="w-2.5 h-2.5" />
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
};

const getSeverityBadge = (severity: IssueSeverity) => {
  const styles: Record<IssueSeverity, { bg: string; color: string; border: string }> = {
    CRITICAL: { bg: 'rgba(185,74,72,0.12)', color: '#B94A48', border: 'rgba(185,74,72,0.3)' },
    HIGH: { bg: 'rgba(198,154,53,0.12)', color: '#C69A35', border: 'rgba(198,154,53,0.3)' },
    MEDIUM: { bg: 'rgba(118,84,200,0.08)', color: '#7654C8', border: 'rgba(118,84,200,0.2)' },
    LOW: { bg: 'var(--bg-muted)', color: 'var(--text-muted)', border: 'var(--border-color)' },
  };
  const s = styles[severity];
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {severity}
    </span>
  );
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-canvas)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '5px 10px',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer',
};

export const TriageQueueTab: React.FC<TriageQueueTabProps> = ({
  issues,
  filters,
  onFilterChange,
  onSelectIssue,
  loading,
  onLoadDemo,
}) => {
  return (
    <div className="space-y-3">

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center p-3 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search issues, components, diagnosis…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none"
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            style={selectStyle}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select value={filters.severity}
            onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
            style={selectStyle}>
            {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <button
            onClick={() => onFilterChange({ ...filters, duplicatesOnly: !filters.duplicatesOnly })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filters.duplicatesOnly
              ? { background: 'rgba(233,130,69,0.12)', color: '#E98245', border: '1px solid rgba(233,130,69,0.35)' }
              : { background: 'var(--bg-canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <CopyCheck className="w-3.5 h-3.5" />
            Duplicates
          </button>

          <button
            onClick={() => onFilterChange({ ...filters, goodFirstOnly: !filters.goodFirstOnly })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filters.goodFirstOnly
              ? { background: 'rgba(118,84,200,0.12)', color: '#7654C8', border: '1px solid rgba(118,84,200,0.35)' }
              : { background: 'var(--bg-canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Good First
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && issues.length > 0 && (
        <div className="px-1 flex items-center justify-between">
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Issue list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="py-16 text-center rounded-xl p-6 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)' }}>
          <Bug className="w-7 h-7 mx-auto opacity-40" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            No Triaged Issues Found
          </h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Sync the repository to fetch and triage issues, or load verified showcase fixtures below.
          </p>
          {onLoadDemo && (
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#E98245' }}>
              <FlaskConical className="w-3.5 h-3.5" />
              Load Verified Showcase Data
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="group px-4 py-3.5 rounded-xl cursor-pointer transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(118,84,200,0.45)';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">

                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      #{issue.issueNumber}
                    </span>
                    {getCategoryBadge(issue.category)}
                    {getSeverityBadge(issue.severity)}

                    {issue.isDuplicate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{ background: 'rgba(233,130,69,0.08)', color: '#E98245', border: '1px solid rgba(233,130,69,0.22)' }}>
                        <CopyCheck className="w-2.5 h-2.5" />
                        Dup #{issue.duplicateIssueNumber ?? '?'} · {Math.round(issue.similarityScore * 100)}%
                      </span>
                    )}
                    {issue.isGoodFirstIssue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{ background: 'rgba(118,84,200,0.08)', color: '#7654C8', border: '1px solid rgba(118,84,200,0.22)' }}>
                        <Sparkles className="w-2.5 h-2.5" />
                        Good First
                      </span>
                    )}
                    {issue.component && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {issue.component}
                      </span>
                    )}
                    {issue.confidenceScore !== undefined && (
                      <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {Math.round(issue.confidenceScore * 100)}% conf
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-semibold leading-snug line-clamp-1 transition-colors"
                    style={{ color: 'var(--text-primary)' }}>
                    {issue.title}
                  </h4>

                  {/* Diagnosis */}
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Diagnosis: </span>
                    {issue.rootCauseHint}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>{issue.author}</span>
                    <span>·</span>
                    <span>{new Date(issue.githubCreatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="self-center shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--text-muted)' }}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
