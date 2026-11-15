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
        className="fixed inset-0 bg-[#25242B]/40 dark:bg-black/60 backdrop-blur-2xs transition-opacity" 
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-xl bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] shadow-xl p-5 sm:p-6 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E3DC] dark:border-[#2E2C36]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#C69A35]/15 text-[#C69A35]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#25242B] dark:text-[#F5F2ED] flex items-center gap-2">
                  Stale Issue SLA Escalation
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6]">
                    Cron: 0 0 9 * * *
                  </span>
                </h3>
                <p className="text-xs text-[#77727C] dark:text-[#9E98A6]">
                  Automated scan for unresolved CRITICAL &amp; HIGH issues &gt; 7 days old
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#77727C] hover:text-[#25242B] dark:hover:text-[#F5F2ED] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 space-y-3 max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#77727C] dark:text-[#9E98A6] flex flex-col items-center gap-2 font-mono">
                <RotateCw className="w-5 h-5 animate-spin text-[#7654C8]" />
                <span>Running manual trigger against StaleIssueScheduler...</span>
              </div>
            ) : !data || data.alerts.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-[#E8E3DC] dark:border-[#2E2C36] p-4">
                <ShieldAlert className="w-6 h-6 text-[#3D7A5A] dark:text-[#569D75] mx-auto mb-1.5 opacity-80" />
                <h4 className="text-xs font-semibold text-[#25242B] dark:text-[#F5F2ED]">
                  All Critical Issues Within SLA
                </h4>
                <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6] mt-0.5">
                  No open high-priority issues have breached the 7-day threshold.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-[#C69A35]/10 border border-[#C69A35]/25 text-xs text-[#C69A35] font-mono">
                  {data.summary}
                </div>

                {data.alerts.map((alert) => (
                  <div
                    key={`${alert.repoFullName}-${alert.issueNumber}`}
                    className="p-3 rounded-lg border border-[#B94A48]/25 bg-[#B94A48]/5 dark:bg-[#B94A48]/10 flex items-start justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono font-bold text-[#B94A48]">#{alert.issueNumber}</span>
                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#B94A48]/15 text-[#B94A48] dark:text-[#E06A68]">
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-[#77727C] font-mono">{alert.repoFullName}</span>
                      </div>
                      <h5 className="text-xs font-semibold text-[#25242B] dark:text-[#F5F2ED]">
                        {alert.title}
                      </h5>
                      <div className="flex items-center gap-1 text-[11px] text-[#C69A35] font-mono">
                        <Clock className="w-3 h-3" /> {alert.daysOpen} days open without resolution
                      </div>
                    </div>

                    {alert.htmlUrl && (
                      <a
                        href={alert.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-[#77727C] hover:text-[#25242B] dark:hover:text-[#F5F2ED] transition shrink-0"
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
          <div className="pt-3 border-t border-[#E8E3DC] dark:border-[#2E2C36] flex items-center justify-between">
            <span className="text-[11px] text-[#77727C] font-mono">
              Endpoint: <code className="text-[#7654C8]">POST /alerts/check-stale</code>
            </span>
            <button
              onClick={fetchScan}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E98245] hover:bg-[#D47236] text-white transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Trigger Scan</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
