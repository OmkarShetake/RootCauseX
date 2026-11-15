-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for triaged issues
CREATE TABLE IF NOT EXISTS triaged_issues (
    id BIGSERIAL PRIMARY KEY,
    repo_full_name VARCHAR(255) NOT NULL,
    issue_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    author VARCHAR(255),
    state VARCHAR(50) DEFAULT 'OPEN',
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    component VARCHAR(100) DEFAULT 'core',
    confidence_score DOUBLE PRECISION DEFAULT 0.85,
    evidence_source VARCHAR(50) DEFAULT 'HEURISTIC',
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_issue_number INTEGER,
    similarity_score DOUBLE PRECISION,
    similarity_explanation TEXT,
    is_good_first_issue BOOLEAN NOT NULL DEFAULT FALSE,
    root_cause_hint TEXT,
    suggested_reply TEXT,
    github_created_at TIMESTAMPTZ,
    triaged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    html_url VARCHAR(500),
    labels TEXT,
    CONSTRAINT uq_repo_issue UNIQUE(repo_full_name, issue_number)
);

CREATE INDEX IF NOT EXISTS idx_triaged_issues_repo ON triaged_issues(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_triaged_issues_severity ON triaged_issues(severity);
CREATE INDEX IF NOT EXISTS idx_triaged_issues_category ON triaged_issues(category);
CREATE INDEX IF NOT EXISTS idx_triaged_issues_component ON triaged_issues(component);
CREATE INDEX IF NOT EXISTS idx_triaged_issues_duplicate ON triaged_issues(is_duplicate);
