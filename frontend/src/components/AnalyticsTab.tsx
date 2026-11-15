import React from 'react';
import { RepoAnalytics, RepoIntelligence } from '../types';
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
import { Activity, Zap, CopyCheck, Clock, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

interface AnalyticsTabProps {
  analytics: RepoAnalytics | null;
  intelligence: RepoIntelligence | null;
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

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, intelligence, loading }) => {
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

  // Component hotspot data
  const componentData = Object.entries(analytics.componentBreakdown || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500">
            <CopyCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {analytics.duplicateRate}%
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">Duplicate Detection Rate</div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              ~{analytics.estimatedHoursSaved} hrs
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">Engineering Time Saved</div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {analytics.goodFirstIssuesCount}
            </div>
            <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">Community Good First Issues</div>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Donut Chart */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Issue Distribution by Category
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Total: {analytics.totalTriagedIssues}</span>
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
                    fontSize: '13px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(val) => <span className="text-xs font-medium text-zinc-400">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Bar Chart */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Issue Severity Breakdown
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">Triage Escalation</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }} 
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#A1A1AA', fontSize: 12 }} 
                  axisLine={{ stroke: '#27272A' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    color: '#FAFAFA',
                    fontSize: '13px'
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

      {/* Component Hotspot Bar Chart (shown when componentBreakdown data available) */}
      {analytics.componentBreakdown && Object.keys(analytics.componentBreakdown).length > 0 && (
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Component Issue Hotspots
              </h4>
            </div>
            <span className="text-xs text-zinc-400">Top affected modules</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={componentData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={{ stroke: '#27272A' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={{ stroke: '#27272A' }} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Formula Explanation */}
      {analytics.formulaExplanation && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Metrics Methodology
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
            {analytics.formulaExplanation}
          </p>
        </div>
      )}

      {/* Intelligence Section */}
      {intelligence && (
        <div className="space-y-4">
          {/* Architectural Risk Score */}
          <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Architectural Risk Score</h4>
              </div>
              <span className={`text-lg font-black ${
                intelligence.architecturalRiskScore >= 70 ? 'text-rose-500' :
                intelligence.architecturalRiskScore >= 40 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {intelligence.architecturalRiskScore}/100
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  intelligence.architecturalRiskScore >= 70 ? 'bg-rose-500' :
                  intelligence.architecturalRiskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${intelligence.architecturalRiskScore}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {intelligence.metricsDocumentation?.riskScoreFormula}
            </p>
          </div>

          {/* Recurring Defect Clusters */}
          {intelligence.recurringDefectClusters && intelligence.recurringDefectClusters.length > 0 && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Recurring Defect Clusters</h4>
              </div>
              <div className="space-y-2">
                {intelligence.recurringDefectClusters.slice(0, 4).map((cluster) => (
                  <div key={cluster.rootIssueNumber} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-amber-500 font-bold mr-2">#{cluster.rootIssueNumber}</span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{cluster.rootIssueTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        {cluster.duplicateCount} dup{cluster.duplicateCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {Math.round(cluster.avgSimilarity * 100)}% avg sim
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
