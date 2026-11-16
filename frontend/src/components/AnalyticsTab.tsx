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
} from 'recharts';
import {
  Activity,
  Zap,
  CopyCheck,
  Clock,
  AlertTriangle,
  Layers,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsTabProps {
  analytics: RepoAnalytics | null;
  intelligence: RepoIntelligence | null;
  loading: boolean;
  darkMode?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  BUG:      '#E98245',
  SECURITY: '#B94A48',
  FEATURE:  '#7654C8',
  DOCS:     '#77727C',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#B94A48',
  HIGH:     '#C69A35',
  MEDIUM:   '#7654C8',
  LOW:      '#9E98A6',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#25242B',
  borderColor:     '#33303D',
  borderRadius:    '8px',
  color:           '#F5F2ED',
  fontSize:        '12px',
  boxShadow:       '0 4px 12px rgba(0,0,0,0.3)',
};

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl p-5 ${className}`}
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; meta?: string }> = ({ icon, title, meta }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
    </div>
    {meta && <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{meta}</span>}
  </div>
);

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics, intelligence, loading, darkMode = false }) => {
  // FIX #8 & #9: SVG cannot resolve CSS variables — use literal hex values based on theme
  const axisTickColor  = darkMode ? '#9E98A6' : '#77727C';
  const gridLineColor  = darkMode ? '#2E2C36' : '#E8E3DC';
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
        ))}
      </div>
    );
  }

  if (!analytics || analytics.totalTriagedIssues === 0) {
    return (
      <div className="py-16 text-center rounded-xl p-6 space-y-2"
        style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)' }}>
        <Activity className="w-7 h-7 mx-auto opacity-40" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No Analytics Data</h3>
        <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Sync the repository or load Demo Mode to populate engineering distributions.
        </p>
      </div>
    );
  }

  const categoryData = Object.entries(analytics.categoryBreakdown || {}).map(([key, val]) => ({
    name: key,
    value: val,
    color: CATEGORY_COLORS[key] || '#77727C',
  }));

  const severityData = Object.entries(analytics.severityBreakdown || {}).map(([key, val]) => ({
    name: key,
    count: val,
    fill: SEVERITY_COLORS[key] || '#77727C',
  }));

  const componentData = Object.entries(analytics.componentBreakdown || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-4">

      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            Icon: CopyCheck, iconBg: 'rgba(233,130,69,0.1)', iconColor: '#E98245',
            value: `${analytics.duplicateRate}%`, label: 'Duplicate Match Rate',
          },
          {
            Icon: Clock, iconBg: 'rgba(118,84,200,0.1)', iconColor: '#7654C8',
            value: `~${analytics.estimatedHoursSaved} hrs`, label: 'Developer Time Saved',
          },
          {
            Icon: Zap, iconBg: 'var(--bg-muted)', iconColor: '#7654C8',
            value: String(analytics.goodFirstIssuesCount), label: 'Good First Issues',
          },
        ].map(({ Icon, iconBg, iconColor, value, label }, idx) => (
          <div key={idx} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-2.5 rounded-lg shrink-0" style={{ background: iconBg }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
            <div>
              <div className="text-xl font-black font-mono tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}>
                {value}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Category donut */}
        <SectionCard>
          <SectionTitle
            title="Issues by Category"
            meta={`${analytics.totalTriagedIssues} total`}
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%"
                  innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {categoryData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Severity bar */}
        <SectionCard>
          <SectionTitle title="Severity Breakdown" meta="Triage priority" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} opacity={0.5} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Component hotspots */}
      {componentData.length > 0 && (
        <SectionCard>
          <SectionTitle
            icon={<Layers className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />}
            title="Component Defect Hotspots"
            meta="Top affected modules"
          />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={componentData} layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} opacity={0.5} horizontal={false} />
                <XAxis type="number" allowDecimals={false}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={88}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#7654C8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Intelligence row */}
      {intelligence && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Risk score */}
          <SectionCard>
            <SectionTitle
              icon={<AlertTriangle className="w-3.5 h-3.5" style={{ color: '#E98245' }} />}
              title="Architectural Risk Score"
            />
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black font-mono"
                style={{
                  color: intelligence.architecturalRiskScore >= 70 ? '#B94A48'
                    : intelligence.architecturalRiskScore >= 40 ? '#C69A35'
                    : '#7654C8',
                }}>
                {intelligence.architecturalRiskScore}
              </span>
              <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden mb-3"
              style={{ background: 'var(--bg-muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${intelligence.architecturalRiskScore}%`,
                  background: intelligence.architecturalRiskScore >= 70 ? '#B94A48'
                    : intelligence.architecturalRiskScore >= 40 ? '#C69A35'
                    : '#7654C8',
                }}
              />
            </div>
            <p className="text-[11px] font-mono leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {intelligence.metricsDocumentation?.riskScoreFormula}
            </p>
          </SectionCard>

          {/* Defect clusters */}
          <SectionCard>
            <SectionTitle
              icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />}
              title="Recurring Defect Clusters"
              meta={`${intelligence.recurringDefectClusters?.length ?? 0} clusters`}
            />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {!intelligence.recurringDefectClusters?.length ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  No recurring clusters found.
                </p>
              ) : (
                intelligence.recurringDefectClusters.slice(0, 4).map((cluster) => (
                  <div key={cluster.rootIssueNumber}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)' }}>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-xs font-mono font-bold shrink-0" style={{ color: '#E98245' }}>
                        #{cluster.rootIssueNumber}
                      </span>
                      <span className="text-xs truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                        {cluster.rootIssueTitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ background: 'rgba(233,130,69,0.12)', color: '#E98245', border: '1px solid rgba(233,130,69,0.28)' }}>
                      {cluster.duplicateCount} dups
                    </span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Formula */}
      {analytics.formulaExplanation && (
        <div className="px-4 py-3 rounded-xl text-xs font-mono leading-relaxed"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Benchmark: </span>
          {analytics.formulaExplanation}
        </div>
      )}
    </div>
  );
};
