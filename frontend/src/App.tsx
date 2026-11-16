import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { KpiMetrics } from './components/KpiMetrics';
import { TriageQueueTab } from './components/TriageQueueTab';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AskRepoTab } from './components/AskRepoTab';
import { StaleAlertsModal } from './components/StaleAlertsModal';
import { api } from './services/api';
import { TriagedIssue, RepoAnalytics, FilterState, RepoIntelligence } from './types';
import {
  AlertCircle,
  FlaskConical,
  X,
  CheckCircle2,
  RotateCw,
  Menu,
} from 'lucide-react';

type TabId = 'queue' | 'analytics' | 'ask';

const TAB_LABELS: Record<TabId, string> = {
  queue: 'Triage Queue',
  analytics: 'Engineering Intelligence',
  ask: 'Ask Your Repo',
};

export function App() {
  const [repoOwner, setRepoOwner] = useState('spring-projects');
  const [repoName, setRepoName] = useState('spring-petclinic');
  const [activeTab, setActiveTab] = useState<TabId>('queue');

  const [issues, setIssues] = useState<TriagedIssue[]>([]);
  const [analytics, setAnalytics] = useState<RepoAnalytics | null>(null);
  const [intelligence, setIntelligence] = useState<RepoIntelligence | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<TriagedIssue | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    severity: '',
    duplicatesOnly: false,
    goodFirstOnly: false,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [isReTriaging, setIsReTriaging] = useState(false);
  const [isStaleModalOpen, setIsStaleModalOpen] = useState(false);
  const [rateLimitBanner, setRateLimitBanner] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    // FIX #1: initialise from localStorage so preference persists across sessions
    // and never conflicts with the HTML class set at load time
    try {
      return localStorage.getItem('rx_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // persist preference
    try { localStorage.setItem('rx_dark_mode', String(darkMode)); } catch {}
  }, [darkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // FIX #7: loadData does NOT depend on filters — filters are sent to the API
  // but should not cause a full reload on every keystroke. The filters effect
  // is kept separate with a debounce so the initial repo load is independent.
  const loadData = useCallback(async (owner: string, repo: string, currentFilters?: FilterState) => {
    setLoadingIssues(true);
    setLoadingAnalytics(true);
    try {
      const [issueList, analyticsData, intelligenceData] = await Promise.all([
        api.getTriagedIssues(owner, repo, currentFilters).catch(() => [] as TriagedIssue[]),
        api.getAnalytics(owner, repo).catch(() => null),
        api.getIntelligence(owner, repo).catch(() => null),
      ]);
      setIssues(issueList);
      setAnalytics(analyticsData);
      setIntelligence(intelligenceData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIssues(false);
      setLoadingAnalytics(false);
    }
  }, []); // no deps — owner/repo/filters passed as arguments

  // Reload when repo changes (immediate)
  useEffect(() => {
    const timer = setTimeout(() => void loadData(repoOwner, repoName, filters), 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoOwner, repoName, loadData]);

  // Re-fetch when filters change (debounced 350ms so search doesn't fire on every keystroke)
  useEffect(() => {
    const timer = setTimeout(() => void loadData(repoOwner, repoName, filters), 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleRepoChange = (owner: string, repo: string) => {
    setRepoOwner(owner);
    setRepoName(repo);
    setRateLimitBanner(null);
    showToast(`Loaded: ${owner}/${repo}`);
  };

  const handleSyncAndAnalyze = async () => {
    setIsSyncing(true);
    setRateLimitBanner(null);
    try {
      showToast('Step 1/2: Fetching & vector-indexing issues…');
      const syncRes = await api.syncKnowledge(repoOwner, repoName);
      if (syncRes.status === 'RATE_LIMITED') {
        setRateLimitBanner(syncRes.message);
        showToast('Notice: GitHub API public rate limit reached');
        return;
      }
      showToast('Step 2/2: Triaging with pgvector & AI…');
      const triaged = await api.triageRepository(repoOwner, repoName);
      setIssues(triaged);
      const [analyticsData, intelligenceData] = await Promise.all([
        api.getAnalytics(repoOwner, repoName).catch(() => null),
        api.getIntelligence(repoOwner, repoName).catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setIntelligence(intelligenceData);
      showToast(`Analyzed ${triaged.length} issues in ${repoOwner}/${repoName}!`);
    } catch (err: any) {

      const msg = err.message || 'Sync failed';
      if (msg.includes('403') || msg.toLowerCase().includes('rate limit')) {
        setRateLimitBanner('GitHub API rate limit reached. Load Demo Mode or add a GitHub Token in the sidebar.');
      } else {
        showToast(`Sync notice: ${msg}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReTriage = async (issueNumber: number) => {
    setIsReTriaging(true);
    try {
      const updated = await api.triageSingleIssue(repoOwner, repoName, issueNumber);
      setIssues((prev) => prev.map((item) => item.issueNumber === issueNumber ? updated : item));
      setSelectedIssue(updated);
      const analyticsData = await api.getAnalytics(repoOwner, repoName);
      setAnalytics(analyticsData);
      showToast(`Issue #${issueNumber} re-triaged!`);
    } catch (err: any) {
      showToast(`Re-triage error: ${err.message}`);
    } finally {
      setIsReTriaging(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const result = await api.loadDemoData(repoOwner, repoName);
      setRateLimitBanner(null);
      showToast(result.message || 'Demo loaded!');
      await loadData(repoOwner, repoName, filters);
    } catch (err: any) {
      showToast(`Demo notice: ${err.message}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>

      {/* Sidebar — desktop fixed */}
      <div className="hidden lg:block">
        <Sidebar
          repoOwner={repoOwner}
          repoName={repoName}
          onRepoChange={handleRepoChange}
          onSyncAndAnalyze={handleSyncAndAnalyze}
          isSyncing={isSyncing}
          onLoadDemo={handleLoadDemo}
          isLoadingDemo={isLoadingDemo}
          onOpenStaleModal={() => setIsStaleModalOpen(true)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          issueCount={issues.length}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              repoOwner={repoOwner}
              repoName={repoName}
              onRepoChange={(o, r) => { handleRepoChange(o, r); setSidebarOpen(false); }}
              onSyncAndAnalyze={() => { handleSyncAndAnalyze(); setSidebarOpen(false); }}
              isSyncing={isSyncing}
              onLoadDemo={() => { handleLoadDemo(); setSidebarOpen(false); }}
              isLoadingDemo={isLoadingDemo}
              onOpenStaleModal={() => { setIsStaleModalOpen(true); setSidebarOpen(false); }}
              darkMode={darkMode}
              onToggleTheme={() => setDarkMode(!darkMode)}
              activeTab={activeTab}
              onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
              issueCount={issues.length}
            />
          </div>
        </div>
      )}

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[220px]">

        {/* Top command bar */}
        <header className="sticky top-0 z-10 px-6 h-12 flex items-center justify-between gap-4"
          style={{
            background: 'var(--bg-canvas)',
            borderBottom: '1px solid var(--border-color)',
          }}>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md"
            style={{ color: 'var(--text-secondary)' }}>
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {TAB_LABELS[activeTab]}
            </span>
            <span style={{ color: 'var(--border-color)' }}>/</span>
            <span className="text-xs font-mono font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
              {repoOwner}/{repoName}
            </span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isSyncing && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono"
                style={{ color: 'var(--text-muted)' }}>
                <RotateCw className="w-3 h-3 animate-spin" style={{ color: '#7654C8' }} />
                Analyzing…
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-5 space-y-5 max-w-5xl w-full mx-auto">

          {/* Rate limit banner */}
          {rateLimitBanner && (
            <div className="p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              style={{ background: 'rgba(233,130,69,0.08)', border: '1px solid rgba(233,130,69,0.28)' }}>
              <div className="flex items-start gap-2" style={{ color: '#E98245' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rateLimitBanner}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleLoadDemo}
                  disabled={isLoadingDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-opacity hover:opacity-90"
                  style={{ background: '#E98245' }}>
                  <FlaskConical className="w-3 h-3" />
                  Load Demo Data
                </button>
                <button
                  onClick={() => setRateLimitBanner(null)}
                  className="p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* KPI strip */}
          <KpiMetrics analytics={analytics} loading={loadingAnalytics} />

          {/* Tab content */}
          {activeTab === 'queue' && (
            <TriageQueueTab
              issues={issues}
              filters={filters}
              onFilterChange={setFilters}
              onSelectIssue={setSelectedIssue}
              loading={loadingIssues}
              onLoadDemo={handleLoadDemo}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              analytics={analytics}
              intelligence={intelligence}
              loading={loadingAnalytics}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'ask' && (
            <AskRepoTab
              repoOwner={repoOwner}
              repoName={repoName}
              onAsk={(q) => api.askRepo(repoOwner, repoName, q)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono"
          style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <span>RootCauseX · Java 21 · Spring Boot 3.4 · Spring AI · pgvector · Redis 7</span>
          <div className="flex items-center gap-3">
            <span>Cosine threshold: 0.88</span>
            <span>·</span>
            <button
              onClick={handleLoadDemo}
              disabled={isLoadingDemo}
              className="transition-colors hover:opacity-80"
              style={{ color: '#E98245' }}>
              Load Fixtures
            </button>
          </div>
        </footer>
      </div>

      {/* Slide-over drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onReTriage={handleReTriage}
        isReTriaging={isReTriaging}
        onToast={showToast}
      />

      {/* Stale alerts modal */}
      <StaleAlertsModal
        isOpen={isStaleModalOpen}
        onClose={() => setIsStaleModalOpen(false)}
        onTriggerCheck={api.checkStaleIssues}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium shadow-xl"
          style={{
            background: '#25242B',
            color: '#F5F2ED',
            border: '1px solid #33303D',
          }}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#7654C8' }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
