import React, { useState } from 'react';
import { 
  RotateCw, 
  Sun, 
  Moon, 
  ShieldAlert,
  Search,
  Key,
  Check,
  X,
  FlaskConical,
  Menu
} from 'lucide-react';

interface NavbarProps {
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
  onLoadDemo,
  isLoadingDemo,
  onOpenStaleModal,
  darkMode,
  onToggleTheme,
}) => {
  const [inputVal, setInputVal] = useState(`${repoOwner}/${repoName}`);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(() => {
    try {
      return localStorage.getItem('rx_github_token') || '';
    } catch {
      return '';
    }
  });
  const [hasSavedToken, setHasSavedToken] = useState(() => {
    try {
      return Boolean(localStorage.getItem('rx_github_token')?.trim());
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = inputVal.trim().split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      onRepoChange(parts[0].trim(), parts[1].trim());
      setIsMobileMenuOpen(false);
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
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/95 dark:bg-[#16151A]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Identity: Graphite + Violet Accent */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#25242B] dark:bg-[#F5F2ED] flex items-center justify-center text-[#F5F2ED] dark:text-[#25242B] font-mono font-black text-sm tracking-tighter shadow-xs">
              RX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#25242B] dark:text-[#F5F2ED]">
                  RootCause<span className="text-[#7654C8] dark:text-[#916FE0]">X</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-[#7654C8]/10 text-[#7654C8] dark:bg-[#916FE0]/15 dark:text-[#916FE0] border border-[#7654C8]/20 dark:border-[#916FE0]/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6] hidden md:block font-medium">
                Repository Defect &amp; Root-Cause Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Search & Presets */}
          <div className="hidden lg:flex flex-1 max-w-md mx-2 flex-col justify-center">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="owner/repo (e.g. spring-projects/spring-petclinic)"
                className="w-full pl-9 pr-16 py-1.5 text-xs font-mono bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] placeholder-[#9E98A6] focus:outline-none focus:ring-1 focus:ring-[#7654C8] focus:border-[#7654C8]"
              />
              <Search className="w-3.5 h-3.5 text-[#77727C] absolute left-3 top-2.5" />
              <button
                type="submit"
                className="absolute right-1 top-1 px-2.5 py-0.5 text-[11px] font-semibold bg-[#EFEBE5] dark:bg-[#282630] text-[#25242B] dark:text-[#F5F2ED] rounded hover:bg-[#E8E3DC] dark:hover:bg-[#33303D] transition cursor-pointer"
              >
                Load
              </button>
            </form>

            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto text-[11px]">
              <span className="text-[#9E98A6] text-[10px] uppercase font-mono tracking-wider">Presets:</span>
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
                    className={`px-2 py-0.5 rounded transition whitespace-nowrap text-[11px] font-mono cursor-pointer ${
                      isSelected
                        ? 'bg-[#7654C8]/15 text-[#7654C8] dark:text-[#916FE0] font-bold border border-[#7654C8]/30'
                        : 'text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            
            {/* Sync & Analyze Repo Button (Violet Primary) */}
            <button
              onClick={onSyncAndAnalyze}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#7654C8] hover:bg-[#6342B2] dark:bg-[#7654C8] dark:hover:bg-[#6342B2] disabled:opacity-50 text-white font-medium text-xs sm:text-sm shadow-xs transition active:scale-98 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Analyzing...' : 'Sync & Analyze'}</span>
            </button>

            {/* Showcase Demo Button (Warm Orange Secondary) */}
            <button
              onClick={onLoadDemo}
              disabled={isLoadingDemo}
              title="Load verified offline presentation fixtures"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E98245]/10 hover:bg-[#E98245]/20 text-[#E98245] dark:text-[#F0955E] border border-[#E98245]/30 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <FlaskConical className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
              <span>Demo Mode</span>
            </button>

            {/* Stale Monitor Button */}
            <button
              onClick={onOpenStaleModal}
              title="SLA Stale Issues Escalate"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED] text-xs font-medium transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#C69A35]" />
              <span>SLA Monitor</span>
            </button>

            {/* GitHub PAT Key Config */}
            <button
              onClick={() => setIsTokenModalOpen(true)}
              title="GitHub Token Configuration"
              className={`p-2 rounded-lg border transition cursor-pointer ${
                hasSavedToken
                  ? 'bg-[#3D7A5A]/10 text-[#3D7A5A] dark:text-[#569D75] border-[#3D7A5A]/30'
                  : 'bg-[#FFFFFF] dark:bg-[#1F1E24] text-[#77727C] dark:text-[#9E98A6] border-[#E8E3DC] dark:border-[#2E2C36] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED] transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-[#C69A35]" /> : <Moon className="w-3.5 h-3.5 text-[#25242B]" />}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] text-[#25242B] dark:text-[#F5F2ED]"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#E8E3DC] dark:border-[#2E2C36] space-y-3 animate-in fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="owner/repo"
                className="w-full pl-9 pr-16 py-2 text-xs font-mono bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED]"
              />
              <Search className="w-3.5 h-3.5 text-[#77727C] absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs font-semibold bg-[#EFEBE5] dark:bg-[#282630] text-[#25242B] dark:text-[#F5F2ED] rounded"
              >
                Load
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_REPOS.map((item) => (
                <button
                  key={`${item.owner}/${item.repo}`}
                  onClick={() => {
                    setInputVal(`${item.owner}/${item.repo}`);
                    onRepoChange(item.owner, item.repo);
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2 py-1 rounded text-xs font-mono bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] text-[#77727C] dark:text-[#9E98A6]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onLoadDemo();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-[#E98245]/10 text-[#E98245] border border-[#E98245]/30"
              >
                Load Demo Data
              </button>
              <button
                onClick={() => {
                  onOpenStaleModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] text-[#77727C] dark:text-[#9E98A6]"
              >
                SLA Monitor
              </button>
            </div>
          </div>
        )}

      </div>

      {/* GitHub Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#7654C8]" />
                <h3 className="text-sm font-bold text-[#25242B] dark:text-[#F5F2ED]">
                  GitHub API Authentication
                </h3>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-[#77727C] hover:text-[#25242B] dark:hover:text-[#F5F2ED]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#77727C] dark:text-[#9E98A6] leading-relaxed">
              Unauthenticated requests share a 60 req/hr public limit. Adding a Personal Access Token unlocks <strong>5,000 req/hr</strong>. Stored locally in your browser only.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#77727C] dark:text-[#9E98A6] uppercase">
                GitHub Token (Classic or Fine-grained)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs font-mono bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] focus:outline-none focus:border-[#7654C8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTokenInput('');
                  try { localStorage.removeItem('rx_github_token'); } catch {}
                  setHasSavedToken(false);
                  setIsTokenModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-[#77727C] hover:text-[#B94A48] transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSaveToken}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#7654C8] hover:bg-[#6342B2] text-white text-xs font-semibold transition"
              >
                <Check className="w-3.5 h-3.5" /> Save Token
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
