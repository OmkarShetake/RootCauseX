import React, { useState } from 'react';
import { TriagedIssue } from '../types';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  CopyCheck, 
  BrainCircuit, 
  MessageSquare, 
  RotateCw, 
  Clock, 
  User,
  Layers
} from 'lucide-react';

interface IssueDetailDrawerProps {
  issue: TriagedIssue | null;
  onClose: () => void;
  onReTriage: (issueNumber: number) => void;
  isReTriaging: boolean;
  onToast: (msg: string) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  onClose,
  onReTriage,
  isReTriaging,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!issue) return null;

  const handleCopyReply = () => {
    if (issue.suggestedReply) {
      navigator.clipboard.writeText(issue.suggestedReply);
      setCopied(true);
      onToast('Maintainer reply copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex pl-6">
        <div className="w-full bg-white dark:bg-[#121215] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50 dark:bg-[#151518]">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono font-bold text-sm text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  #{issue.issueNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {issue.category}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                  issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  issue.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {issue.severity}
                </span>
                {issue.isDuplicate && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Duplicate
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                {issue.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-zinc-400" /> {issue.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-400" /> {new Date(issue.githubCreatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {issue.htmlUrl && (
                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Section 1: AI Root-Cause Diagnosis (Violet Theme) */}
            <div className="p-5 rounded-2xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/15 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  AI Root-Cause Technical Diagnosis
                </div>
                {/* Evidence Source Badge */}
                {issue.evidenceSource && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                    issue.evidenceSource === 'HISTORICAL_MATCH'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : issue.evidenceSource === 'STACK_TRACE_ANALYSIS'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  }`}>
                    {issue.evidenceSource.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Component Badge */}
              {issue.component && (
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Component:</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono font-semibold">
                    {issue.component}
                  </span>
                </div>
              )}

              <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-100 leading-relaxed font-mono">
                {issue.rootCauseHint}
              </p>

              {/* Confidence Score Bar */}
              {issue.confidenceScore !== undefined && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-400">AI Confidence</span>
                    <span className={`font-mono font-bold text-sm ${
                      issue.confidenceScore >= 0.75 ? 'text-emerald-400' :
                      issue.confidenceScore >= 0.50 ? 'text-amber-400' : 'text-zinc-400'
                    }`}>
                      {Math.round(issue.confidenceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        issue.confidenceScore >= 0.75 ? 'bg-emerald-500' :
                        issue.confidenceScore >= 0.50 ? 'bg-amber-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round(issue.confidenceScore * 100))}%` }}
                    />
                  </div>
                  {issue.confidenceScore < 0.50 && (
                    <p className="text-xs text-zinc-400 italic">
                      Low confidence — insufficient reproduction steps to pinpoint root cause.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Duplicate Detection & Similarity Meter (Amber Theme) */}
            {issue.isDuplicate && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                    <CopyCheck className="w-4 h-4 text-amber-500" />
                    Duplicate Candidate Detected
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                    {Math.round(issue.similarityScore * 100)}% Match
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.similarityScore * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                    Vector embedding similarity matches resolved historical issue #{issue.duplicateIssueNumber}.
                  </p>
                </div>
              </div>
            )}

            {/* Similarity Explanation Panel */}
            {issue.isDuplicate && issue.similarityExplanation && (
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181B] space-y-2">
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                  Similarity Evidence
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono">
                  {issue.similarityExplanation}
                </p>
              </div>
            )}

            {/* Section 3: One-Click Ready-to-Post Maintainer Reply */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Suggested Maintainer Response
                </div>
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition active:scale-95 shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Maintainer Reply'}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181B] text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                {issue.suggestedReply}
              </div>
            </div>

            {/* Section 4: Original Issue Description */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Original Issue Report
              </h4>
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181B] text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {issue.body || 'No description provided by author.'}
              </div>
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#151518] flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Last triaged: {new Date(issue.triagedAt).toLocaleTimeString()}
            </span>
            <button
              onClick={() => onReTriage(issue.issueNumber)}
              disabled={isReTriaging}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReTriaging ? 'animate-spin' : ''}`} />
              <span>Re-Triage Issue</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
