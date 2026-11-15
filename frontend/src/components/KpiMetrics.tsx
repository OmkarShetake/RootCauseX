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

  const metrics = [
    {
      label: 'Triaged Issues',
      value: loading ? '—' : total,
      subtext: 'Indexed via vector store & LLM',
      icon: Layers,
      highlight: false,
    },
    {
      label: 'Duplicates Detected',
      value: loading ? '—' : `${duplicates} (${duplicateRate}%)`,
      subtext: `~${hoursSaved} hrs saved @ 2.5h baseline`,
      icon: CopyCheck,
      highlight: duplicates > 0,
      badge: 'Time Saved',
      badgeClass: 'bg-[#E98245]/15 text-[#E98245] dark:text-[#F0955E] border-[#E98245]/30',
    },
    {
      label: 'Critical & Security',
      value: loading ? '—' : critical,
      subtext: critical > 0 ? 'Urgent SLA escalation pending' : 'Zero unmitigated criticals',
      icon: AlertTriangle,
      highlight: critical > 0,
      badge: critical > 0 ? 'Urgent' : 'Safe',
      badgeClass: critical > 0 
        ? 'bg-[#B94A48]/15 text-[#B94A48] dark:text-[#E06A68] border-[#B94A48]/30'
        : 'bg-[#3D7A5A]/15 text-[#3D7A5A] dark:text-[#569D75] border-[#3D7A5A]/30',
    },
    {
      label: 'Good First Issues',
      value: loading ? '—' : goodFirst,
      subtext: 'Curated for new contributors',
      icon: Sparkles,
      highlight: false,
      badge: 'Onboarding',
      badgeClass: 'bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] border-[#7654C8]/20',
    },
  ];

  return (
    <div className="rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] shadow-xs overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E3DC] dark:divide-[#2E2C36]">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-[#77727C] dark:text-[#9E98A6]">
                <span className="font-semibold uppercase tracking-wider text-[11px]">{item.label}</span>
                <Icon className="w-3.5 h-3.5 opacity-70" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#25242B] dark:text-[#F5F2ED]">
                  {item.value}
                </span>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6] truncate">
                {item.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
