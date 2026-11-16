import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  BarChart2,
  MessageSquareText,
  RotateCw,
  Sun,
  Moon,
  ShieldAlert,
  Key,
  Check,
  X,
  FlaskConical,
  Search,
  ChevronDown,
} from 'lucide-react';

type TabId = 'queue' | 'analytics' | 'ask';

interface SidebarProps {
  repoOwner: string;
  repoName: string;
  onRepoChange: (owner: string, repo: string) => void;
  onSyncAndAnalyze: () => void;
  isSyncing: boolean;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  onOpenStaleModal: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  issueCount: number;
}

const PRESET_REPOS = [
  { owner: 'spring-projects', repo: 'spring-petclinic',   label: 'spring-petclinic' },
  { owner: 'iluwatar',        repo: 'java-design-patterns', label: 'java-design-patterns' },
  { owner: 'spring-projects', repo: 'spring-boot',         label: 'spring-boot' },
];

const NAV_ITEMS: { id: TabId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'queue',     label: 'Triage Queue',      Icon: ({ className }) => <Inbox           className={className} /> },
  { id: 'analytics', label: 'Engineering Intel', Icon: ({ className }) => <BarChart2        className={className} /> },
  { id: 'ask',       label: 'Ask Your Repo',     Icon: ({ className }) => <MessageSquareText className={className} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  repoOwner,
  repoName,
  onRepoChange,
  onSyncAndAnalyze,
  isSyncing,
  onLoadDemo,
  isLoadingDemo,
  onOpenStaleModal,
  darkMode,
  onToggleTheme,
  activeTab,
  onTabChange,
  issueCount,
}) => {
  // FIX #4: keep inputVal in sync with external prop changes
  const [inputVal, setInputVal]           = useState(`${repoOwner}/${repoName}`);
  const [showPresets, setShowPresets]     = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput]       = useState(() => {
    try { return localStorage.getItem('rx_github_token') || ''; } catch { return ''; }
  });
  const [hasSavedToken, setHasSavedToken] = useState(() => {
    try { return Boolean(localStorage.getItem('rx_github_token')?.trim()); } catch { return false; }
  });

  // FIX #4: sync when parent-driven repo changes
  useEffect(() => {
    setInputVal(`${repoOwner}/${repoName}`);
  }, [repoOwner, repoName]);

  // FIX #5: close preset dropdown on outside click
  const presetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPresets) return;
    const handler = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPresets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = inputVal.trim().split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      onRepoChange(parts[0].trim(), parts[1].trim());
      setShowPresets(false);
    }
  };

  const handleSaveToken = () => {
    try {
      if (tokenInput.trim()) {
        localStorage.setItem('rx_github_token', tokenInput.trim());
        setHasSavedToken(true);
      } else {
        localStorage.removeItem('rx_github_token');
        setHasSavedToken(false);
      }
      setIsTokenModalOpen(false);
    } catch { /* ignore */ }
  };

  // FIX #11: resolve violet per theme instead of hardcoding #7654C8
  const violetColor = darkMode ? '#916FE0' : '#7654C8';

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-20 select-none"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs tracking-tighter shrink-0"
              style={{ background: '#7654C8', color: '#F5F2ED' }}
            >
              RX
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight leading-none" style={{ color: '#F5F2ED' }}>
                RootCause<span style={{ color: violetColor }}>X</span>
              </div>
              <div className="text-[10px] mt-0.5 font-mono font-medium truncate" style={{ color: '#6F6A76' }}>
                Defect Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Repo selector */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div ref={presetRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5" style={{ color: '#6F6A76' }} />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onFocus={() => setShowPresets(true)}
                  placeholder="owner/repo"
                  className="w-full pl-7 pr-7 py-2 text-[11px] font-mono rounded-md outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--sidebar-border)',
                    color: '#F5F2ED',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPresets((p) => !p)}
                  className="absolute right-2 top-2.5"
                  style={{ color: '#6F6A76' }}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </form>

            {showPresets && (
              <div
                className="mt-1.5 rounded-md overflow-hidden"
                style={{ border: '1px solid var(--sidebar-border)', background: 'rgba(255,255,255,0.04)' }}
              >
                {PRESET_REPOS.map((item) => {
                  const isSelected = repoOwner === item.owner && repoName === item.repo;
                  return (
                    <button
                      key={`${item.owner}/${item.repo}`}
                      type="button"
                      onClick={() => {
                        setInputVal(`${item.owner}/${item.repo}`);
                        onRepoChange(item.owner, item.repo);
                        setShowPresets(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-mono transition-colors"
                      style={{
                        color: isSelected ? '#916FE0' : '#9E98A6',
                        background: isSelected ? 'rgba(118,84,200,0.12)' : 'transparent',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <div className="px-2 pb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#4A4855' }}>
              Workspace
            </span>
          </div>

          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`nav-item w-full text-left ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span className="flex-1 truncate">{label}</span>
              {id === 'queue' && issueCount > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{
                    background: activeTab === id ? 'rgba(118,84,200,0.3)' : 'rgba(255,255,255,0.08)',
                    color: activeTab === id ? '#916FE0' : '#6F6A76',
                  }}
                >
                  {issueCount}
                </span>
              )}
              {id === 'ask' && (
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(118,84,200,0.25)', color: '#916FE0' }}
                >
                  AI
                </span>
              )}
            </button>
          ))}

          {/* Actions */}
          <div className="pt-4 px-2 pb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#4A4855' }}>
              Actions
            </span>
          </div>

          {/* FIX #11: use resolved violetColor instead of hardcoded hex */}
          <button
            onClick={onSyncAndAnalyze}
            disabled={isSyncing}
            className="nav-item w-full"
            style={{ color: isSyncing ? '#6F6A76' : violetColor }}
          >
            <RotateCw
              className={`nav-icon ${isSyncing ? 'animate-spin' : ''}`}
              style={{ color: 'inherit' }}
            />
            <span>{isSyncing ? 'Analyzing…' : 'Sync & Analyze'}</span>
          </button>

          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="nav-item w-full"
            style={{ color: '#E98245' }}
          >
            <FlaskConical
              className={`nav-icon ${isLoadingDemo ? 'animate-spin' : ''}`}
              style={{ color: 'inherit' }}
            />
            <span>Demo Mode</span>
          </button>

          <button onClick={onOpenStaleModal} className="nav-item w-full">
            <ShieldAlert className="nav-icon" style={{ color: '#C69A35' }} />
            <span>SLA Monitor</span>
          </button>
        </nav>

        {/* Bottom utility bar */}
        <div className="px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <button onClick={() => setIsTokenModalOpen(true)} className="nav-item w-full">
            <Key className="nav-icon" style={{ color: hasSavedToken ? '#569D75' : undefined }} />
            <span className="text-[12px]">{hasSavedToken ? 'Token Active' : 'GitHub Token'}</span>
            {hasSavedToken && (
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3D7A5A' }} />
            )}
          </button>

          <button onClick={onToggleTheme} className="nav-item w-full">
            {darkMode
              ? <Sun  className="nav-icon" style={{ color: '#C69A35' }} />
              : <Moon className="nav-icon" />
            }
            <span className="text-[12px]">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* GitHub Token Modal */}
      {isTokenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" style={{ color: violetColor }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  GitHub API Authentication
                </h3>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 rounded-md transition-colors hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Unauthenticated requests share a 60 req/hr public limit. A Personal Access Token unlocks{' '}
              <strong style={{ color: 'var(--text-primary)' }}>5,000 req/hr</strong>. Stored locally in your browser only.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                GitHub Token (Classic or Fine-grained)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg outline-none"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTokenInput('');
                  try { localStorage.removeItem('rx_github_token'); } catch {}
                  setHasSavedToken(false);
                  setIsTokenModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                style={{ color: '#B94A48' }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSaveToken}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#7654C8' }}
              >
                <Check className="w-3.5 h-3.5" /> Save Token
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
