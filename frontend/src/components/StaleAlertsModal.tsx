import React, { useState, useEffect, useCallback } from 'react';
import { StaleCheckResponse } from '../types';
import { X, ShieldAlert, RotateCw, ExternalLink, Clock } from 'lucide-react';

interface StaleAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCheck: () => Promise<StaleCheckResponse>;
}

export const StaleAlertsModal: React.FC<StaleAlertsModalProps> = ({
  isOpen,
  onClose,
  onTriggerCheck,
}) => {
  const [data, setData] = useState<StaleCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onTriggerCheck();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [onTriggerCheck]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => void fetchScan(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, fetchScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0"
        style={{ background: 'rgba(37,36,43,0.5)', backdropFilter: 'blur(4px)' }}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg"
                style={{ background: 'rgba(198,154,53,0.12)' }}>
                <ShieldAlert className="w-4 h-4" style={{ color: '#C69A35' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Stale Issue SLA Escalation
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                    Cron: 0 0 9 * * *
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Scans CRITICAL &amp; HIGH issues older than 7 days
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <RotateCw className="w-5 h-5 animate-spin" style={{ color: '#7654C8' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Running against StaleIssueScheduler…
                </span>
              </div>
            ) : !data || data.alerts.length === 0 ? (
              <div className="py-10 text-center rounded-xl p-4"
                style={{ border: '1px dashed var(--border-color)' }}>
                <ShieldAlert className="w-6 h-6 mx-auto mb-2 opacity-50" style={{ color: '#3D7A5A' }} />
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  All Critical Issues Within SLA
                </h4>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  No high-priority issues have breached the 7-day threshold.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg text-xs font-mono"
                  style={{ background: 'rgba(198,154,53,0.08)', border: '1px solid rgba(198,154,53,0.22)', color: '#C69A35' }}>
                  {data.summary}
                </div>

                {data.alerts.map((alert) => (
                  <div
                    key={`${alert.repoFullName}-${alert.issueNumber}`}
                    className="p-3.5 rounded-xl flex items-start justify-between gap-3"
                    style={{ background: 'rgba(185,74,72,0.05)', border: '1px solid rgba(185,74,72,0.22)' }}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs flex-wrap">
                        <span className="font-mono font-bold" style={{ color: '#B94A48' }}>
                          #{alert.issueNumber}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ background: 'rgba(185,74,72,0.12)', color: '#B94A48' }}>
                          {alert.severity}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {alert.repoFullName}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {alert.title}
                      </h5>
                      <div className="flex items-center gap-1 text-[11px] font-mono"
                        style={{ color: '#C69A35' }}>
                        <Clock className="w-3 h-3" />
                        {alert.daysOpen} days open without resolution
                      </div>
                    </div>

                    {alert.htmlUrl && (
                      <a href={alert.htmlUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-md transition-colors shrink-0"
                        style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Endpoint: <code style={{ color: '#7654C8' }}>POST /alerts/check-stale</code>
            </span>
            <button
              onClick={fetchScan}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#E98245' }}>
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Trigger Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
