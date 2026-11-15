import React, { useState } from 'react';
import { TriagedIssue } from '../types';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  CopyCheck, 
  ShieldAlert, 
  BrainCircuit, 
  MessageSquare, 
  RotateCw, 
  Clock, 
  User 
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
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50 dark:bg-[#151518]">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  #{issue.issueNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {issue.category}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  issue.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {issue.severity}
                </span>
                {issue.isDuplicate && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Duplicate
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {issue.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {issue.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {new Date(issue.githubCreatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {issue.htmlUrl && (
                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Section 1: AI Root-Cause Diagnosis (Violet Theme) */}
            <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/10 space-y-2">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 text-violet-400" />
                AI Root-Cause Technical Diagnosis
              </div>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-mono">
                {issue.rootCauseHint}
              </p>
            </div>

            {/* Section 2: Duplicate Detection & Similarity Meter (Amber Theme) */}
            {issue.isDuplicate && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                    <CopyCheck className="w-4 h-4 text-amber-500" />
                    Duplicate Candidate Detected
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {Math.round(issue.similarityScore * 100)}% Match
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.similarityScore * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Vector embedding similarity matches resolved historical issue #{issue.duplicateIssueNumber}.
                  </p>
                </div>
              </div>
            )}

            {/* Section 3: One-Click Ready-to-Post Maintainer Reply */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Suggested Maintainer Response
                </div>
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition active:scale-95 shadow-sm shadow-emerald-500/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Maintainer Reply'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181B] text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                {issue.suggestedReply}
              </div>
            </div>

            {/* Section 4: Original Issue Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Original Issue Report
              </h4>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181B] text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
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
