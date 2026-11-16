import React, { useState, useEffect, useCallback } from 'react';
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
  Layers,
  Code2,
} from 'lucide-react';
import { api } from '../services/api';
import { CodePatchResponse } from '../types';

interface IssueDetailDrawerProps {
  issue: TriagedIssue | null;
  onClose: () => void;
  onReTriage: (issueNumber: number) => void;
  isReTriaging: boolean;
  onToast: (msg: string) => void;
}

const SeverityStyle: Record<string, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(185,74,72,0.1)', color: '#B94A48', border: 'rgba(185,74,72,0.28)' },
  HIGH: { bg: 'rgba(198,154,53,0.1)', color: '#C69A35', border: 'rgba(198,154,53,0.28)' },
  MEDIUM: { bg: 'rgba(118,84,200,0.08)', color: '#7654C8', border: 'rgba(118,84,200,0.22)' },
  LOW: { bg: 'var(--bg-muted)', color: 'var(--text-muted)', border: 'var(--border-color)' },
};

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  issue,
  onClose,
  onReTriage,
  isReTriaging,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [patch, setPatch] = useState<CodePatchResponse | null>(null);
  const [patchLoading, setPatchLoading] = useState(false);

  useEffect(() => {
    setPatch(null);
    setPatchLoading(false);
  }, [issue?.issueNumber]);

  if (!issue) return null;

  const handleCopyReply = () => {
    if (issue.suggestedReply) {
      navigator.clipboard.writeText(issue.suggestedReply);
      setCopied(true);
      onToast('Maintainer reply copied!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGeneratePatch = useCallback(async () => {
    if (!issue) return;
    const parts = issue.repoFullName.split('/');
    const owner = parts[0] ?? '';
    const repo = parts[1] ?? '';
    setPatchLoading(true);
    try {
      const result = await api.generatePatch(owner, repo, issue.issueNumber);
      setPatch(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Patch generation failed';
      onToast(msg);
    } finally {
      setPatchLoading(false);
    }
  }, [issue, onToast]);

  const sevStyle = SeverityStyle[issue.severity] ?? SeverityStyle.LOW;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity"
        style={{ background: 'rgba(37,36,43,0.45)', backdropFilter: 'blur(3px)' }}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full flex flex-col h-full overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
          }}>

          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between gap-4"
            style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
            <div className="space-y-2 min-w-0 flex-1">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  #{issue.issueNumber}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  {issue.category}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}` }}>
                  {issue.severity}
                </span>
                {issue.isDuplicate && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                    style={{ background: 'rgba(233,130,69,0.1)', color: '#E98245', border: '1px solid rgba(233,130,69,0.28)' }}>
                    Duplicate
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {issue.title}
              </h3>

              <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {issue.author}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(issue.githubCreatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {issue.htmlUrl && (
                <a href={issue.htmlUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* AI Root-Cause */}
            <div className="rounded-xl p-5 space-y-3"
              style={{ background: 'rgba(118,84,200,0.05)', border: '1px solid rgba(118,84,200,0.22)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#7654C8' }}>
                  <BrainCircuit className="w-4 h-4" />
                  AI Root-Cause Diagnosis
                </div>
                {issue.evidenceSource && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--bg-card)', color: '#7654C8', border: '1px solid rgba(118,84,200,0.28)' }}>
                    {issue.evidenceSource.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {issue.component && (
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Component:</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    {issue.component}
                  </span>
                </div>
              )}

              <p className="text-xs leading-relaxed font-mono" style={{ color: 'var(--text-primary)' }}>
                {issue.rootCauseHint}
              </p>

              {issue.confidenceScore !== undefined && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Analysis Confidence</span>
                    <span className="font-mono font-bold" style={{ color: '#7654C8' }}>
                      {Math.round(issue.confidenceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.confidenceScore * 100))}%`, background: '#7654C8' }}
                    />
                  </div>
                  {issue.confidenceScore < 0.5 && (
                    <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                      Low confidence — sparse description; reproduction steps needed.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Duplicate detection */}
            {issue.isDuplicate && (
              <div className="rounded-xl p-5 space-y-3"
                style={{ background: 'rgba(233,130,69,0.05)', border: '1px solid rgba(233,130,69,0.22)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#E98245' }}>
                    <CopyCheck className="w-4 h-4" />
                    Duplicate Candidate
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-card)', color: '#E98245', border: '1px solid rgba(233,130,69,0.28)' }}>
                    {Math.round(issue.similarityScore * 100)}% match
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-muted)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(issue.similarityScore * 100))}%`, background: '#E98245' }} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Matches resolved issue #{issue.duplicateIssueNumber}.
                  </p>
                </div>

                {issue.similarityExplanation && (
                  <div className="pt-2 text-xs leading-relaxed"
                    style={{ borderTop: '1px solid rgba(233,130,69,0.15)', color: 'var(--text-primary)' }}>
                    <span className="font-semibold">Matching rationale: </span>
                    {issue.similarityExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Suggested reply */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}>
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />
                  Suggested Maintainer Response
                </div>
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: '#7654C8' }}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}>
                {issue.suggestedReply}
              </div>
            </div>

            {/* Code Patch Result */}
            {patch && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}>
                  <Code2 className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />
                  Generated Code Patch
                </div>
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(118,84,200,0.05)', border: '1px solid rgba(118,84,200,0.22)' }}>
                  {patch.targetFile && patch.targetFile !== 'unknown' && (
                    <div className="text-xs font-mono font-semibold" style={{ color: '#7654C8' }}>
                      {patch.targetFile}
                    </div>
                  )}
                  {patch.explanation && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {patch.explanation}
                    </p>
                  )}
                  {patch.gitDiff && (
                    <pre className="text-xs font-mono overflow-x-auto rounded-lg p-3 leading-relaxed"
                      style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {patch.gitDiff}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Original report */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Original Issue Report
              </h4>
              <div className="p-4 rounded-xl text-xs whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed font-mono"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}>
                {issue.body || 'No description provided.'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Triaged: {new Date(issue.triagedAt).toLocaleTimeString()}
            </span>
            <button
              onClick={handleGeneratePatch}
              disabled={patchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}>
              <Code2 className={`w-3.5 h-3.5 ${patchLoading ? 'animate-spin' : ''}`} style={{ color: '#7654C8' }} />
              {patchLoading ? 'Generating…' : 'Generate Patch'}
            </button>
            <button
              onClick={() => onReTriage(issue.issueNumber)}
              disabled={isReTriaging}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}>
              <RotateCw className={`w-3.5 h-3.5 ${isReTriaging ? 'animate-spin' : ''}`} />
              Re-Triage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
