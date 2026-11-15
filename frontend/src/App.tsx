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
  AlertCircle,
  FlaskConical,
  X
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
  const [rateLimitBanner, setRateLimitBanner] = useState<string | null>(null);
  
  const [darkMode, setDarkMode] = useState(false); // Default to light theme #F5F2ED warm canvas
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
    setRateLimitBanner(null);
    showToast(`Loaded: ${owner}/${repo}`);
  };

  const handleSyncAndAnalyze = async () => {
    setIsSyncing(true);
    setRateLimitBanner(null);
    try {
      showToast(`Step 1/2: Fetching closed issues & vector indexing...`);
      const syncRes = await api.syncKnowledge(repoOwner, repoName);
      
      if (syncRes.status === 'RATE_LIMITED') {
        setRateLimitBanner(syncRes.message);
        showToast('Notice: GitHub API public rate limit reached');
        return;
      }

      showToast(`Step 2/2: Triaging issues with pgvector & AI engine...`);
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
        setRateLimitBanner('GitHub API rate limit reached on Render shared IP (60 req/hr). Click "Load Showcase Demo Data" to test with full verified fixtures, or add a GitHub Token in settings.');
      } else {
        showToast(`Sync Notice: ${msg}`);
      }
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
      showToast(result.message || 'Demo showcase loaded!');
      await loadData(repoOwner, repoName);
    } catch (err: any) {
      showToast(`Demo load notice: ${err.message}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#16151A] text-[#25242B] dark:text-[#F5F2ED] flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Enterprise Command Bar */}
      <Navbar
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Rate Limit Notice Banner (Warm Orange Theme) */}
        {rateLimitBanner && (
          <div className="p-3.5 rounded-xl border border-[#E98245]/30 bg-[#E98245]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed animate-in fade-in">
            <div className="flex items-center gap-2 text-[#E98245] dark:text-[#F0955E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rateLimitBanner}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLoadDemo}
                disabled={isLoadingDemo}
                className="px-3 py-1 rounded-md bg-[#E98245] hover:bg-[#D47236] text-white font-semibold transition active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                <FlaskConical className="w-3 h-3" />
                <span>Load Showcase Data</span>
              </button>
              <button
                onClick={() => setRateLimitBanner(null)}
                className="p-1 text-[#77727C] hover:text-[#25242B] dark:hover:text-[#F5F2ED]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Executive KPI Metrics Bar */}
        <KpiMetrics analytics={analytics} loading={loadingAnalytics} />

        {/* Segmented Tab Navigation Control */}
        <div className="flex items-center justify-between border-b border-[#E8E3DC] dark:border-[#2E2C36] pt-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'queue'
                  ? 'border-[#7654C8] text-[#7654C8] dark:border-[#916FE0] dark:text-[#916FE0]'
                  : 'border-transparent text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Triage Queue</span>
              {issues.length > 0 && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[11px] bg-[#EFEBE5] dark:bg-[#282630] text-[#77727C] dark:text-[#9E98A6]">
                  {issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-[#7654C8] text-[#7654C8] dark:border-[#916FE0] dark:text-[#916FE0]'
                  : 'border-transparent text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Engineering Intelligence</span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'ask'
                  ? 'border-[#7654C8] text-[#7654C8] dark:border-[#916FE0] dark:text-[#916FE0]'
                  : 'border-transparent text-[#77727C] dark:text-[#9E98A6] hover:text-[#25242B] dark:hover:text-[#F5F2ED]'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Ask Your Repo (RAG)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0]">
                AI
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#77727C] dark:text-[#9E98A6]">
            <span>repo:</span>
            <span className="font-semibold text-[#25242B] dark:text-[#F5F2ED]">{repoOwner}/{repoName}</span>
          </div>
        </div>

        {/* Tab Workspace */}
        <div>
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

      {/* Slide-Over Root-Cause Technical Drawer */}
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
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#25242B] text-[#F5F2ED] dark:bg-[#F5F2ED] dark:text-[#25242B] shadow-xl border border-[#33303D] dark:border-[#E8E3DC] text-xs font-medium animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#7654C8] dark:text-[#7654C8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E8E3DC] dark:border-[#2E2C36] py-3.5 mt-auto bg-[#F5F2ED]/60 dark:bg-[#16151A]/60 text-center text-xs text-[#77727C] dark:text-[#9E98A6]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <p>RootCauseX • Java 21 • Spring Boot 3.4 • Spring AI • pgvector • Redis 7</p>
          <div className="flex items-center gap-3">
            <span>Cosine duplicate threshold: 0.88</span>
            <span>•</span>
            <button
              onClick={handleLoadDemo}
              disabled={isLoadingDemo}
              className="text-[#E98245] hover:underline cursor-pointer"
            >
              Load Showcase Fixtures
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
