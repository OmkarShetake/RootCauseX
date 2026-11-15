import React from 'react';
import { RepoAnalytics } from '../types';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Activity, ShieldCheck, Zap, CopyCheck, Clock } from 'lucide-react';

interface AnalyticsTabProps {
  analytics: RepoAnalytics | null;
  loading: boolean;
}

// Strict Non-Blue Color Palette: Emerald, Amber, Coral/Rose, Zinc/Stone
const CATEGORY_COLORS: Record<string, string> = {
  BUG: '#F59E0B',      // Warm Amber
  SECURITY: '#F43F5E', // Coral/Crimson
  FEATURE: '#10B981',  // Emerald Green
  DOCS: '#71717A',     // Zinc
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#F43F5E', // Coral / Crimson
  HIGH: '#F59E0B',     // Warm Amber
  MEDIUM: '#10B981',   // Emerald
  LOW: '#71717A',      // Slate / Zinc
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 animate-pulse" />
        <div className="h-80 rounded-xl bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!analytics || analytics.totalTriagedIssues === 0) {
    return (
      <div className="py-20 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121215]">
        <Activity className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          No Analytics Data Available
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
          Sync knowledge and run issue triage to populate repository health distributions and duplicate rates.
        </p>
      </div>
    );
  }

  // Format data for Recharts Pie
  const categoryData = Object.entries(analytics.categoryBreakdown || {}).map(([key, val]) => ({
    name: key,
    value: val,
    color: CATEGORY_COLORS[key] || '#71717A',
  }));

  // Format data for Recharts Bar
  const severityData = Object.entries(analytics.severityBreakdown || {}).map(([key, val]) => ({
    name: key,
    count: val,
    fill: SEVERITY_COLORS[key] || '#71717A',
  }));

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <CopyCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {analytics.duplicateRate}%
            </div>
            <div className="text-xs text-zinc-500">Duplicate Detection Rate</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              ~{analytics.estimatedHoursSaved} hrs
            </div>
            <div className="text-xs text-zinc-500">Engineering Time Saved</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {analytics.goodFirstIssuesCount}
            </div>
            <div className="text-xs text-zinc-500">Open Community Onboarding Issues</div>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Donut Chart */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Issue Distribution by Category
            </h4>
            <span className="text-xs text-zinc-400">Total: {analytics.totalTriagedIssues}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    color: '#FAFAFA',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(val) => <span className="text-xs text-zinc-400">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Bar Chart */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Issue Severity Breakdown
            </h4>
            <span className="text-xs text-zinc-400">Triage Escalation</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#A1A1AA', fontSize: 11 }} 
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#A1A1AA', fontSize: 11 }} 
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    color: '#FAFAFA',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
