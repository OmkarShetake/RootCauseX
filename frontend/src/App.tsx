import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KpiMetrics } from './components/KpiMetrics';
import { TriageQueueTab } from './components/TriageQueueTab';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AskRepoTab } from './components/AskRepoTab';
import { StaleAlertsModal } from './components/StaleAlertsModal';
import { api } from './services/api';
import { TriagedIssue, RepoAnalytics, FilterState, RepoIntelligence } from './types';
import { 
  Inbox, 
  BarChart2, 
  MessageSquareText, 
  CheckCircle2,
  FlaskConical
} from 'lucide-react';

export function App() {
  const [repoOwner, setRepoOwner] = useState('spring-projects');
  const [repoName, setRepoName] = useState('spring-petclinic');
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'ask'>('queue');
  
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
  
  const [darkMode, setDarkMode] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme class with document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async (owner: string, repo: string) => {
    setLoadingIssues(true);
    setLoadingAnalytics(true);
    try {
      const [issueList, analyticsData, intelligenceData] = await Promise.all([
        api.getTriagedIssues(owner, repo, filters).catch(() => [] as TriagedIssue[]),
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
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(repoOwner, repoName);
    }, 0);
    return () => clearTimeout(timer);
  }, [repoOwner, repoName, loadData]);

  const handleRepoChange = (owner: string, repo: string) => {
    setRepoOwner(owner);
    setRepoName(repo);
    showToast(`Loaded repository: ${owner}/${repo}`);
  };

  const handleSyncAndAnalyze = async () => {
    setIsSyncing(true);
    try {
      // Step 1: Sync historical resolved issues for RAG indexing
      showToast(`Step 1/2: Syncing historical closed issues for RAG vector index...`);
      await api.syncKnowledge(repoOwner, repoName);

      // Step 2: Triage live open issues
      showToast(`Step 2/2: Triaging open issues with pgvector similarity & LLM...`);
      const triaged = await api.triageRepository(repoOwner, repoName);
      setIssues(triaged);

      // Refresh analytics
      const analyticsData = await api.getAnalytics(repoOwner, repoName);
      setAnalytics(analyticsData);

      showToast(`Successfully analyzed ${triaged.length} issues in ${repoOwner}/${repoName}!`);
    } catch (err: any) {
      showToast(`Sync Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReTriage = async (issueNumber: number) => {
    setIsReTriaging(true);
    try {
      const updated = await api.triageSingleIssue(repoOwner, repoName, issueNumber);
      setIssues((prev) => prev.map((item) => (item.issueNumber === issueNumber ? updated : item)));
      setSelectedIssue(updated);
      
      const analyticsData = await api.getAnalytics(repoOwner, repoName);
      setAnalytics(analyticsData);

      showToast(`Issue #${issueNumber} re-triaged successfully!`);
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
      showToast(result.message || 'Demo data loaded! Refreshing...');
      await loadData(repoOwner, repoName);
    } catch (err: any) {
      showToast(`Demo load error: ${err.message}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Command Bar */}
      <Navbar
        repoOwner={repoOwner}
        repoName={repoName}
        onRepoChange={handleRepoChange}
        onSyncAndAnalyze={handleSyncAndAnalyze}
        isSyncing={isSyncing}
        onOpenStaleModal={() => setIsStaleModalOpen(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Metrics Summary */}
        <KpiMetrics analytics={analytics} loading={loadingAnalytics} />

        {/* Tab Selection Bar */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition ${
              activeTab === 'queue'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Smart Triage Queue</span>
            {issues.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {issues.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Repo Health Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition ${
              activeTab === 'ask'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Ask Your Repo (RAG)</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              AI
            </span>
          </button>
        </div>

        {/* Workspace Tab View */}
        <div>
          {activeTab === 'queue' && (
            <TriageQueueTab
              issues={issues}
              filters={filters}
              onFilterChange={setFilters}
              onSelectIssue={setSelectedIssue}
              loading={loadingIssues}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              analytics={analytics}
              intelligence={intelligence}
              loading={loadingAnalytics}
            />
          )}

          {activeTab === 'ask' && (
            <AskRepoTab
              repoOwner={repoOwner}
              repoName={repoName}
              onAsk={(q) => api.askRepo(repoOwner, repoName, q)}
            />
          )}
        </div>

      </main>

      {/* Slide-Over Root-Cause Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onReTriage={handleReTriage}
        isReTriaging={isReTriaging}
        onToast={showToast}
      />

      {/* Stale Alerts Cron Modal */}
      <StaleAlertsModal
        isOpen={isStaleModalOpen}
        onClose={() => setIsStaleModalOpen(false)}
        onTriggerCheck={api.checkStaleIssues}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xl border border-zinc-700 dark:border-zinc-300 text-xs sm:text-sm font-medium animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 mt-auto bg-white/50 dark:bg-[#09090B]/50 text-center text-xs text-zinc-500">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <p>RootCauseX · Java 21 · Spring Boot 3.4 · Spring AI · pgvector · Redis 7</p>
          <button
            onClick={handleLoadDemo}
            disabled={isLoadingDemo}
            title="Load offline demo fixtures for presentation"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-medium transition disabled:opacity-50"
          >
            <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
            {isLoadingDemo ? 'Loading...' : 'Load Demo Data'}
          </button>
        </div>
      </footer>

    </div>
  );
}

export default App;
