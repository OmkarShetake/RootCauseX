import React from 'react';
import { Layers, CopyCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { RepoAnalytics } from '../types';

interface KpiMetricsProps {
  analytics: RepoAnalytics | null;
  loading: boolean;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ analytics, loading }) => {
  const total = analytics?.totalTriagedIssues ?? 0;
  const duplicates = analytics?.duplicatesCount ?? 0;
  const duplicateRate = analytics?.duplicateRate ?? 0;
  const hoursSaved = analytics?.estimatedHoursSaved ?? 0;
  const goodFirst = analytics?.goodFirstIssuesCount ?? 0;
  
  const critical = (analytics?.severityBreakdown?.['CRITICAL'] ?? 0) + 
                   (analytics?.categoryBreakdown?.['SECURITY'] ?? 0);

  const cards = [
    {
      title: 'Total Triaged Issues',
      value: loading ? '—' : total,
      subtext: 'Processed via Vector & LLM',
      icon: Layers,
      color: 'text-zinc-400',
      bgGlow: 'from-zinc-500/10 to-transparent',
      borderColor: 'border-zinc-200 dark:border-zinc-800',
    },
    {
      title: 'Duplicates Caught',
      value: loading ? '—' : duplicates,
      subtext: `${duplicateRate}% rate • ~${hoursSaved} hrs saved`,
      icon: CopyCheck,
      color: 'text-amber-500',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30 dark:border-amber-500/20',
      badge: 'Time Saved',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    {
      title: 'Critical & Security Alerts',
      value: loading ? '—' : critical,
      subtext: 'High-priority vulnerabilities',
      icon: AlertTriangle,
      color: 'text-rose-500',
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-500/30 dark:border-rose-500/20',
      badge: critical > 0 ? 'Urgent' : 'Safe',
      badgeColor: critical > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
    {
      title: 'Good First Issues',
      value: loading ? '—' : goodFirst,
      subtext: 'Beginner-friendly scope',
      icon: Sparkles,
      color: 'text-emerald-500',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30 dark:border-emerald-500/20',
      badge: 'Community',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden p-6 rounded-2xl border bg-white dark:bg-[#121215] ${card.borderColor} shadow-sm transition hover:shadow-md`}
          >
            {/* Ambient subtle glow */}
            <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-br ${card.bgGlow} blur-xl pointer-events-none`} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {card.title}
              </span>
              <IconComponent className={`w-5 h-5 ${card.color}`} />
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {card.value}
              </span>
              {card.badge && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
