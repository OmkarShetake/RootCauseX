import React, { useState } from 'react';
import { 
  GitBranch, 
  RotateCw, 
  Sun, 
  Moon, 
  ShieldAlert, 
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  repoOwner: string;
  repoName: string;
  onRepoChange: (owner: string, repo: string) => void;
  onSyncAndAnalyze: () => void;
  isSyncing: boolean;
  onOpenStaleModal: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const PRESET_REPOS = [
  { owner: 'spring-projects', repo: 'spring-petclinic', label: 'spring-petclinic' },
  { owner: 'iluwatar', repo: 'java-design-patterns', label: 'java-design-patterns' },
  { owner: 'spring-projects', repo: 'spring-boot', label: 'spring-boot' },
];

export const Navbar: React.FC<NavbarProps> = ({
  repoOwner,
  repoName,
  onRepoChange,
  onSyncAndAnalyze,
  isSyncing,
  onOpenStaleModal,
  darkMode,
  onToggleTheme,
}) => {
  const [inputVal, setInputVal] = useState(`${repoOwner}/${repoName}`);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = inputVal.trim().split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      onRepoChange(parts[0].trim(), parts[1].trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#0E0E11]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl tracking-tight">
              RX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                  RootCause<span className="text-emerald-500">X</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  AI Triage v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                GitHub Issue Triage &amp; Root-Cause Engine
              </p>
            </div>
          </div>

          {/* Repo Input & Preset Chips */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="owner/repo (e.g. spring-projects/spring-petclinic)"
                className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Load
              </button>
            </form>

            {/* Preset chips */}
            <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto text-[11px]">
              <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">Presets:</span>
              {PRESET_REPOS.map((item) => {
                const isSelected = repoOwner === item.owner && repoName === item.repo;
                return (
                  <button
                    key={`${item.owner}/${item.repo}`}
                    type="button"
                    onClick={() => {
                      setInputVal(`${item.owner}/${item.repo}`);
                      onRepoChange(item.owner, item.repo);
                    }}
                    className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Sync & Analyze Repo Button */}
            <button
              onClick={onSyncAndAnalyze}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing Knowledge...' : 'Sync & Analyze'}
              </span>
            </button>

            {/* Stale Scan Alert Button */}
            <button
              onClick={onOpenStaleModal}
              title="Manual Trigger for Stale Issue Cron Scheduler"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs sm:text-sm font-medium transition"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">Stale Alerts</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
