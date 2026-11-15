import { 
  TriagedIssue, 
  KnowledgeSyncResponse, 
  RepoAnalytics, 
  AskRepoResponse, 
  StaleCheckResponse,
  FilterState 
} from '../types';

const BASE_URL = '/api/v1';

export const api = {
  async syncKnowledge(owner: string, repo: string): Promise<KnowledgeSyncResponse> {
    const res = await fetch(`${BASE_URL}/repos/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Sync failed: ${res.statusText}`);
    }
    return res.json();
  },

  async triageRepository(owner: string, repo: string): Promise<TriagedIssue[]> {
    const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/triage`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Triage failed: ${res.statusText}`);
    }
    return res.json();
  },

  async triageSingleIssue(owner: string, repo: string, issueNumber: number): Promise<TriagedIssue> {
    const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}/triage`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Issue triage failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getTriagedIssues(owner: string, repo: string, filters?: Partial<FilterState>): Promise<TriagedIssue[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.duplicatesOnly) params.append('isDuplicate', 'true');
    if (filters?.goodFirstOnly) params.append('isGoodFirstIssue', 'true');
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString();
    const url = `${BASE_URL}/repos/${owner}/${repo}/issues${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch issues: ${res.statusText}`);
    }
    return res.json();
  },

  async getAnalytics(owner: string, repo: string): Promise<RepoAnalytics> {
    const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/analytics`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch analytics: ${res.statusText}`);
    }
    return res.json();
  },

  async askRepo(owner: string, repo: string, question: string): Promise<AskRepoResponse> {
    const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Ask Repo failed: ${res.statusText}`);
    }
    return res.json();
  },

  async checkStaleIssues(): Promise<StaleCheckResponse> {
    const res = await fetch('/api/v1/alerts/check-stale', {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Stale scan failed: ${res.statusText}`);
    }
    return res.json();
  }
};
