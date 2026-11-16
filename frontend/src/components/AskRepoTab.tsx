import React, { useState, useRef, useEffect } from 'react';
import { AskRepoResponse, CitedIssue } from '../types';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  Sparkles,
  Bookmark,
  RotateCw,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citedIssues?: CitedIssue[];
  timestamp: string;
}

interface AskRepoTabProps {
  repoOwner: string;
  repoName: string;
  onAsk: (question: string) => Promise<AskRepoResponse>;
}

const PRESET_QUESTIONS = [
  'What are common database connection timeout or pool leak patterns?',
  'Are there any security CVEs or authorization issues recorded?',
  'Which beginner-friendly issues can new contributors tackle?',
  'How was the HikariCP batch persistence deadlock resolved?',
];

export const AskRepoTab: React.FC<AskRepoTabProps> = ({ repoOwner, repoName, onAsk }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I'm your RAG Assistant for **${repoOwner}/${repoName}**. Ask me about past bug patterns, security disclosures, or architectural resolutions indexed in the repository knowledge base.`,
      timestamp: 'Session start',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (q?: string) => {
    const question = (q || inputVal).trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInputVal('');
    setLoading(true);

    try {
      const response = await onAsk(question);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.answer,
        citedIssues: response.citedIssues,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'Please sync repository knowledge first.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden"
      style={{
        height: 'clamp(420px, calc(100vh - 240px), 680px)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}>

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(118,84,200,0.1)' }}>
            <Bot className="w-4 h-4" style={{ color: '#7654C8' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Ask Your Repo
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(118,84,200,0.1)', color: '#7654C8', border: '1px solid rgba(118,84,200,0.22)' }}>
                pgvector RAG
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {repoOwner}/{repoName}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
        <span className="text-[10px] font-mono uppercase tracking-wider shrink-0 flex items-center gap-1"
          style={{ color: 'var(--text-muted)' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#E98245' }} />
          Suggestions:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors disabled:opacity-50"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}>
            {q.length > 48 ? q.slice(0, 48) + '…' : q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(118,84,200,0.1)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#7654C8' }} />
                </div>
              )}

              <div className={`max-w-xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
                }`}
                  style={isUser
                    ? { background: '#25242B', color: '#F5F2ED' }
                    : { background: 'var(--bg-canvas)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }
                  }>
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.citedIssues && msg.citedIssues.length > 0 && (
                    <div className="mt-3 pt-2.5 space-y-1.5"
                      style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div className="text-[11px] font-mono font-bold flex items-center gap-1 uppercase tracking-wider"
                        style={{ color: '#7654C8' }}>
                        <Bookmark className="w-3 h-3" />
                        Grounded Citations:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citedIssues.map((cited) => (
                          <a
                            key={cited.issueNumber}
                            href={cited.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono transition-colors"
                            style={{
                              background: 'var(--bg-card)',
                              color: '#7654C8',
                              border: '1px solid rgba(118,84,200,0.25)',
                            }}>
                            <span className="font-bold">#{cited.issueNumber}</span>
                            <span className="max-w-[110px] truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                              {cited.title}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] font-mono px-1 ${isUser ? 'text-right' : 'text-left'}`}
                  style={{ color: 'var(--text-muted)' }}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#25242B' }}>
                  <User className="w-3.5 h-3.5" style={{ color: '#F5F2ED' }} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(118,84,200,0.1)' }}>
              <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#7654C8' }} />
            </div>
            <div className="px-3.5 py-2.5 rounded-xl rounded-tl-sm text-xs font-mono"
              style={{ background: 'var(--bg-canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              Retrieving from vector store…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-canvas)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Ask about ${repoOwner}/${repoName}…`}
            className="flex-1 px-3.5 py-2 text-xs rounded-lg outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="px-3.5 py-2 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 transition-opacity disabled:opacity-40"
            style={{ background: '#7654C8' }}>
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
