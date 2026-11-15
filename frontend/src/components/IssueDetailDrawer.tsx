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
        className="absolute inset-0 bg-[#25242B]/40 dark:bg-black/60 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex pl-4 sm:pl-6">
        <div className="w-full bg-[#FFFFFF] dark:bg-[#1F1E24] border-l border-[#E8E3DC] dark:border-[#2E2C36] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E8E3DC] dark:border-[#2E2C36] flex items-start justify-between gap-4 bg-[#F5F2ED]/70 dark:bg-[#16151A]/70">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-mono font-bold text-xs text-[#25242B] dark:text-[#F5F2ED] bg-[#EFEBE5] dark:bg-[#282630] px-2 py-0.5 rounded border border-[#E8E3DC] dark:border-[#2E2C36]">
                  #{issue.issueNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6]">
                  {issue.category}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  issue.severity === 'CRITICAL' ? 'bg-[#B94A48]/15 text-[#B94A48] dark:text-[#E06A68] border border-[#B94A48]/30' :
                  issue.severity === 'HIGH' ? 'bg-[#C69A35]/15 text-[#C69A35] dark:text-[#E0B654] border border-[#C69A35]/30' :
                  'bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36]'
                }`}>
                  {issue.severity}
                </span>
                {issue.isDuplicate && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E98245]/15 text-[#E98245] dark:text-[#F0955E] border border-[#E98245]/30">
                    Duplicate
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#25242B] dark:text-[#F5F2ED] leading-snug">
                {issue.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-[#77727C] dark:text-[#9E98A6] font-mono">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {issue.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {new Date(issue.githubCreatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {issue.htmlUrl && (
                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#EFEBE5] dark:bg-[#282630] hover:bg-[#E8E3DC] dark:hover:bg-[#33303D] text-[#77727C] dark:text-[#9E98A6] transition"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-[#EFEBE5] dark:bg-[#282630] hover:bg-[#E8E3DC] dark:hover:bg-[#33303D] text-[#77727C] dark:text-[#9E98A6] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* Section 1: AI Root-Cause Diagnosis (Violet Theme) */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#7654C8]/30 bg-[#7654C8]/5 dark:bg-[#916FE0]/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[#7654C8] dark:text-[#916FE0] font-bold text-xs uppercase tracking-wider">
                  <BrainCircuit className="w-4 h-4" />
                  AI Root-Cause Technical Diagnosis
                </div>
                {/* Evidence Source Badge */}
                {issue.evidenceSource && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-[#FFFFFF] dark:bg-[#1F1E24] text-[#7654C8] dark:text-[#916FE0] border-[#7654C8]/30">
                    {issue.evidenceSource.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Component Badge */}
              {issue.component && (
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#7654C8] dark:text-[#916FE0]" />
                  <span className="text-xs text-[#77727C] dark:text-[#9E98A6]">Component:</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#1F1E24] text-[#25242B] dark:text-[#F5F2ED] border border-[#E8E3DC] dark:border-[#2E2C36]">
                    {issue.component}
                  </span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-[#25242B] dark:text-[#F5F2ED] leading-relaxed font-mono">
                {issue.rootCauseHint}
              </p>

              {/* Confidence Score Bar */}
              {issue.confidenceScore !== undefined && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#77727C] dark:text-[#9E98A6]">Analysis Confidence</span>
                    <span className="font-mono font-bold text-[#7654C8] dark:text-[#916FE0]">
                      {Math.round(issue.confidenceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#EFEBE5] dark:bg-[#282630] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7654C8] dark:bg-[#916FE0] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.confidenceScore * 100))}%` }}
                    />
                  </div>
                  {issue.confidenceScore < 0.50 && (
                    <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6] italic">
                      Low confidence: sparse description requires reproduction steps.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Duplicate Detection & Similarity Meter (Warm Orange Theme) */}
            {issue.isDuplicate && (
              <div className="p-4 sm:p-5 rounded-xl border border-[#E98245]/30 bg-[#E98245]/5 dark:bg-[#F0955E]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#E98245] dark:text-[#F0955E] font-bold text-xs uppercase tracking-wider">
                    <CopyCheck className="w-4 h-4" />
                    Duplicate Candidate Detected
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E98245] dark:text-[#F0955E] bg-[#FFFFFF] dark:bg-[#1F1E24] px-2 py-0.5 rounded border border-[#E98245]/30">
                    {Math.round(issue.similarityScore * 100)}% Match
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-[#EFEBE5] dark:bg-[#282630] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#E98245] dark:bg-[#F0955E] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.similarityScore * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#77727C] dark:text-[#9E98A6]">
                    Matches historical resolved issue #{issue.duplicateIssueNumber}.
                  </p>
                </div>

                {issue.similarityExplanation && (
                  <div className="pt-2 border-t border-[#E98245]/20 text-xs text-[#25242B] dark:text-[#F5F2ED] leading-relaxed">
                    <span className="font-semibold">Matching rationale: </span>{issue.similarityExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Section 3: One-Click Ready-to-Post Maintainer Reply */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#25242B] dark:text-[#F5F2ED] uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7654C8]" />
                  Suggested Maintainer Response
                </div>
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#7654C8] hover:bg-[#6342B2] text-white rounded-md transition active:scale-98 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Response'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/60 dark:bg-[#16151A]/60 text-xs sm:text-sm text-[#25242B] dark:text-[#F5F2ED] whitespace-pre-wrap leading-relaxed font-sans">
                {issue.suggestedReply}
              </div>
            </div>

            {/* Section 4: Original Issue Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#77727C] dark:text-[#9E98A6] uppercase tracking-wider">
                Original Issue Report
              </h4>
              <div className="p-4 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/40 dark:bg-[#16151A]/40 text-xs text-[#25242B] dark:text-[#F5F2ED] whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed font-mono">
                {issue.body || 'No description provided by author.'}
              </div>
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/60 dark:bg-[#16151A]/60 flex items-center justify-between">
            <span className="text-[11px] text-[#77727C] dark:text-[#9E98A6] font-mono">
              Triaged: {new Date(issue.triagedAt).toLocaleTimeString()}
            </span>
            <button
              onClick={() => onReTriage(issue.issueNumber)}
              disabled={isReTriaging}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] text-[#25242B] dark:text-[#F5F2ED] hover:bg-[#EFEBE5] dark:hover:bg-[#282630] transition cursor-pointer"
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
