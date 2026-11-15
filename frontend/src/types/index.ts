export type IssueCategory = 'BUG' | 'SECURITY' | 'FEATURE' | 'DOCS';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TriagedIssue {
  id: number;
  repoFullName: string;
  issueNumber: number;
  title: string;
  body: string;
  author: string;
  state: string;
  category: IssueCategory;
  severity: IssueSeverity;
  isDuplicate: boolean;
  duplicateIssueNumber: number | null;
  similarityScore: number;
  isGoodFirstIssue: boolean;
  rootCauseHint: string;
  suggestedReply: string;
  githubCreatedAt: string;
  triagedAt: string;
  htmlUrl: string;
  labels: string[];
}

export interface KnowledgeSyncResponse {
  owner: string;
  repo: string;
  repoFullName: string;
  syncedCount: number;
  status: string;
  message: string;
}

export interface RepoAnalytics {
  repoFullName: string;
  totalTriagedIssues: number;
  duplicatesCount: number;
  duplicateRate: number;
  goodFirstIssuesCount: number;
  estimatedHoursSaved: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
}

export interface CitedIssue {
  issueNumber: number;
  title: string;
  url: string;
  similarity: number;
}

export interface AskRepoResponse {
  question: string;
  repoFullName: string;
  answer: string;
  citedIssues: CitedIssue[];
}

export interface StaleIssueAlert {
  repoFullName: string;
  issueNumber: number;
  title: string;
  severity: string;
  category: string;
  daysOpen: number;
  githubCreatedAt: string;
  htmlUrl: string;
}

export interface StaleCheckResponse {
  checkedCount: number;
  staleCriticalCount: number;
  alerts: StaleIssueAlert[];
  summary: string;
}

export interface FilterState {
  search: string;
  category: string;
  severity: string;
  duplicatesOnly: boolean;
  goodFirstOnly: boolean;
}
