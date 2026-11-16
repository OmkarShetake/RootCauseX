import React from 'react';
import { Layers, CopyCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { RepoAnalytics } from '../types';

interface KpiMetricsProps {
  analytics: RepoAnalytics | null;
  loading: boolean;
}

interface StatItem {
  label: string;
  value: string;
  sub: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  accent: string;
  pill?: string | null;
  pillStyle?: React.CSSProperties;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ analytics, loading }) => {
  const total      = analytics?.totalTriagedIssues ?? 0;
  const duplicates = analytics?.duplicatesCount ?? 0;
  const dupRate    = analytics?.duplicateRate ?? 0;
  const hoursSaved = analytics?.estimatedHoursSaved ?? 0;
  const goodFirst  = analytics?.goodFirstIssuesCount ?? 0;
  const critical   =
    (analytics?.severityBreakdown?.['CRITICAL'] ?? 0) +
    (analytics?.categoryBreakdown?.['SECURITY'] ?? 0);

  const stats: StatItem[] = [
    {
      label: 'Triaged',
      value: loading ? '—' : String(total),
      sub: 'issues indexed',
      Icon: Layers,
      accent: '#9E98A6',
    },
    {
      label: 'Duplicates',
      value: loading ? '—' : String(duplicates),
      sub: `${dupRate}% rate · ~${hoursSaved}h saved`,
      Icon: CopyCheck,
      accent: '#E98245',
      pill: duplicates > 0 ? `${dupRate}%` : null,
      pillStyle: { background: 'rgba(233,130,69,0.12)', color: '#E98245', border: '1px solid rgba(233,130,69,0.28)' },
    },
    {
      label: 'Critical & Security',
      value: loading ? '—' : String(critical),
      sub: critical > 0 ? 'SLA escalation pending' : 'None unmitigated',
      Icon: AlertTriangle,
      accent: critical > 0 ? '#B94A48' : '#3D7A5A',
      pill: critical > 0 ? 'Urgent' : 'Safe',
      pillStyle: critical > 0
        ? { background: 'rgba(185,74,72,0.12)', color: '#B94A48', border: '1px solid rgba(185,74,72,0.28)' }
        : { background: 'rgba(61,122,90,0.12)', color: '#3D7A5A', border: '1px solid rgba(61,122,90,0.28)' },
    },
    {
      label: 'Good First',
      value: loading ? '—' : String(goodFirst),
      sub: 'contributor-ready',
      Icon: Sparkles,
      accent: '#7654C8',
      pill: goodFirst > 0 ? 'Onboarding' : null,
      pillStyle: { background: 'rgba(118,84,200,0.1)', color: '#7654C8', border: '1px solid rgba(118,84,200,0.22)' },
    },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, accent, pill, pillStyle }, idx) => (
          <div
            key={idx}
            className="px-5 py-4 flex flex-col gap-2"
            style={{
              borderRight: idx < 3 ? '1px solid var(--border-color)' : undefined,
              borderBottom: idx < 2 ? '1px solid var(--border-color)' : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {label}
              </span>
              <Icon style={{ color: accent, opacity: 0.8, width: 14, height: 14 }} />
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                className="text-2xl font-black font-mono tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {value}
              </span>
              {pill && pillStyle && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={pillStyle}
                >
                  {pill}
                </span>
              )}
            </div>

            <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
