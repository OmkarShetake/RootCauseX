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
import { Activity, Zap, CopyCheck, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface AnalyticsTabProps {
  analytics: RepoAnalytics | null;
  intelligence: RepoIntelligence | null;
  loading: boolean;
}

// Graphite Studio Palette (Strictly Zero Blue, Zero Green Domination)
const CATEGORY_COLORS: Record<string, string> = {
  BUG: '#E98245',      // Warm Orange
  SECURITY: '#B94A48', // Brick Crimson
  FEATURE: '#7654C8',  // Violet
  DOCS: '#77727C',     // Neutral Graphite
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#B94A48', // Brick Crimson
  HIGH: '#C69A35',     // Antique Gold / Amber
  MEDIUM: '#7654C8',   // Violet
  LOW: '#77727C',      // Neutral Graphite
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, intelligence, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] animate-pulse" />
        <div className="h-72 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] animate-pulse" />
      </div>
    );
  }

  if (!analytics || analytics.totalTriagedIssues === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] p-6 space-y-2">
        <Activity className="w-8 h-8 text-[#77727C] mx-auto opacity-60" />
        <h3 className="text-base font-bold text-[#25242B] dark:text-[#F5F2ED]">
          No Analytics Data Available
        </h3>
        <p className="text-xs text-[#77727C] dark:text-[#9E98A6] max-w-sm mx-auto">
          Sync repository knowledge or click &ldquo;Demo Mode&rdquo; in the navigation bar to populate engineering distributions.
        </p>
      </div>
    );
  }

  // Format data for Recharts Pie
  const categoryData = Object.entries(analytics.categoryBreakdown || {}).map(([key, val]) => ({
    name: key,
    value: val,
    color: CATEGORY_COLORS[key] || '#77727C',
  }));

  // Format data for Recharts Bar
  const severityData = Object.entries(analytics.severityBreakdown || {}).map(([key, val]) => ({
    name: key,
    count: val,
    fill: SEVERITY_COLORS[key] || '#77727C',
  }));

  // Component hotspot data
  const componentData = Object.entries(analytics.componentBreakdown || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-[#E98245]/10 text-[#E98245] dark:text-[#F0955E]">
            <CopyCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#25242B] dark:text-[#F5F2ED]">
              {analytics.duplicateRate}%
            </div>
            <div className="text-xs text-[#77727C] dark:text-[#9E98A6] font-medium">Duplicate Match Rate</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#25242B] dark:text-[#F5F2ED]">
              ~{analytics.estimatedHoursSaved} hrs
            </div>
            <div className="text-xs text-[#77727C] dark:text-[#9E98A6] font-medium">Developer Triage Saved</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-[#EFEBE5] dark:bg-[#282630] text-[#25242B] dark:text-[#F5F2ED]">
            <Zap className="w-5 h-5 text-[#7654C8]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#25242B] dark:text-[#F5F2ED]">
              {analytics.goodFirstIssuesCount}
            </div>
            <div className="text-xs text-[#77727C] dark:text-[#9E98A6] font-medium">Good First Issues</div>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Category Donut Chart */}
        <div className="p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#25242B] dark:text-[#F5F2ED]">
              Issue Distribution by Category
            </h4>
            <span className="text-[11px] font-mono text-[#77727C] dark:text-[#9E98A6]">Total: {analytics.totalTriagedIssues}</span>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#25242B',
                    borderColor: '#33303D',
                    borderRadius: '8px',
                    color: '#F5F2ED',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={30}
                  formatter={(val) => <span className="text-xs text-[#77727C] dark:text-[#9E98A6] font-mono">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Bar Chart */}
        <div className="p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#25242B] dark:text-[#F5F2ED]">
              Issue Severity Breakdown
            </h4>
            <span className="text-[11px] font-mono text-[#77727C] dark:text-[#9E98A6]">Triage Priority</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DC" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#77727C', fontSize: 11 }} 
                  axisLine={{ stroke: '#E8E3DC' }}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#77727C', fontSize: 11 }} 
                  axisLine={{ stroke: '#E8E3DC' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#25242B',
                    borderColor: '#33303D',
                    borderRadius: '8px',
                    color: '#F5F2ED',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Component Hotspots */}
      {componentData.length > 0 && (
        <div className="p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7654C8]" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#25242B] dark:text-[#F5F2ED]">
                Component Defect Hotspots
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#77727C] dark:text-[#9E98A6]">Top affected modules</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={componentData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DC" opacity={0.3} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#77727C', fontSize: 11 }} axisLine={{ stroke: '#E8E3DC' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#77727C', fontSize: 11 }} axisLine={{ stroke: '#E8E3DC' }} tickLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#25242B', borderColor: '#33303D', borderRadius: '8px', color: '#F5F2ED', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#7654C8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Engineering Intelligence: Risk Score & Clusters */}
      {intelligence && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Architectural Risk Score */}
          <div className="p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E98245]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#25242B] dark:text-[#F5F2ED]">
                  Architectural Risk Score
                </h4>
              </div>
              <span className={`text-xl font-mono font-black ${
                intelligence.architecturalRiskScore >= 70 ? 'text-[#B94A48] dark:text-[#E06A68]' :
                intelligence.architecturalRiskScore >= 40 ? 'text-[#C69A35] dark:text-[#E0B654]' : 'text-[#7654C8]'
              }`}>
                {intelligence.architecturalRiskScore}/100
              </span>
            </div>

            <div className="w-full bg-[#EFEBE5] dark:bg-[#282630] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  intelligence.architecturalRiskScore >= 70 ? 'bg-[#B94A48]' :
                  intelligence.architecturalRiskScore >= 40 ? 'bg-[#C69A35]' : 'bg-[#7654C8]'
                }`}
                style={{ width: `${intelligence.architecturalRiskScore}%` }}
              />
            </div>

            <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6] font-mono leading-relaxed">
              {intelligence.metricsDocumentation?.riskScoreFormula}
            </p>
          </div>

          {/* Recurring Defect Clusters */}
          <div className="p-5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7654C8]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#25242B] dark:text-[#F5F2ED]">
                  Recurring Defect Clusters
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[#77727C] dark:text-[#9E98A6]">
                {intelligence.recurringDefectClusters?.length ?? 0} clusters
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(!intelligence.recurringDefectClusters || intelligence.recurringDefectClusters.length === 0) ? (
                <p className="text-xs text-[#77727C] dark:text-[#9E98A6] italic py-2">
                  No recurring duplicate clusters recorded for this repository.
                </p>
              ) : (
                intelligence.recurringDefectClusters.slice(0, 3).map((cluster) => (
                  <div key={cluster.rootIssueNumber} className="p-2.5 rounded-lg bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-bold text-[#E98245] mr-1.5">#{cluster.rootIssueNumber}</span>
                      <span className="text-xs text-[#25242B] dark:text-[#F5F2ED] truncate font-medium">{cluster.rootIssueTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E98245]/15 text-[#E98245] dark:text-[#F0955E] border border-[#E98245]/30 shrink-0">
                      {cluster.duplicateCount} dups
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Formula Explanation Card */}
      {analytics.formulaExplanation && (
        <div className="p-3.5 rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] text-xs text-[#77727C] dark:text-[#9E98A6] font-mono leading-relaxed">
          <span className="font-semibold text-[#25242B] dark:text-[#F5F2ED]">Benchmark Standard: </span>
          {analytics.formulaExplanation}
        </div>
      )}

    </div>
  );
};
