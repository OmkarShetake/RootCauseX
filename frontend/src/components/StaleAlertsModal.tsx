import React, { useState, useEffect, useCallback } from 'react';
import { StaleCheckResponse } from '../types';
import { 
  X, 
  ShieldAlert, 
  RotateCw, 
  ExternalLink, 
  Clock
} from 'lucide-react';

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
      const timer = setTimeout(() => {
        void fetchScan();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Stale Critical Issues Monitor
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    Cron: 0 0 9 * * *
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Automated SLA escalation for unresolved CRITICAL &amp; HIGH issues &gt; 7 days old
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 space-y-4 max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <RotateCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>Running manual trigger against StaleIssueScheduler...</span>
              </div>
            ) : !data || data.alerts.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No Stale Critical Issues Detected
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  All triaged CRITICAL and HIGH issues are within the 7-day resolution SLA.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
                  {data.summary}
                </div>

                {data.alerts.map((alert) => (
                  <div
                    key={`${alert.repoFullName}-${alert.issueNumber}`}
                    className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-rose-500">#{alert.issueNumber}</span>
                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-zinc-400">{alert.repoFullName}</span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {alert.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          <Clock className="w-3 h-3" /> {alert.daysOpen} days open without fix
                        </span>
                      </div>
                    </div>

                    {alert.htmlUrl && (
                      <a
                        href={alert.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Trigger endpoint: <code className="text-emerald-500">POST /api/v1/alerts/check-stale</code>
            </span>
            <button
              onClick={fetchScan}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Trigger Stale Check Now</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
