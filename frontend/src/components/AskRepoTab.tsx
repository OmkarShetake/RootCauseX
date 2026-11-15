import React, { useState } from 'react';
import { AskRepoResponse, CitedIssue } from '../types';
import { 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  Sparkles, 
  Bookmark, 
  RotateCw 
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
  'What are common database connection timeouts or pool leak patterns?',
  'Are there any security CVEs or authorization issues recorded?',
  'Which beginner-friendly issues or typos can new contributors tackle?',
  'How was the HikariCP batch persistence deadlock resolved?',
];

export const AskRepoTab: React.FC<AskRepoTabProps> = ({
  repoOwner,
  repoName,
  onAsk,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your RootCauseX RAG Assistant for **${repoOwner}/${repoName}**. Ask me questions about past bug patterns, security disclosures, or architectural resolutions indexed in the repository knowledge base.`,
      timestamp: 'Session start',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (q?: string) => {
    const question = (q || inputVal).trim();
    if (!question || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const response = await onAsk(question);
      const botMsg: Message = {
        role: 'assistant',
        content: response.answer,
        citedIssues: response.citedIssues,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const botMsg: Message = {
        role: 'assistant',
        content: `Error retrieving grounded knowledge: ${err.message || 'Please ensure you have synced repository knowledge first.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#151518] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
              Ask Your Repo (RAG Assistant)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 font-semibold">
                pgvector RAG
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Grounded contextual answering over {repoOwner}/{repoName}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#151518]/50 flex items-center gap-2.5 overflow-x-auto text-xs">
        <span className="text-xs text-zinc-400 font-semibold shrink-0 flex items-center gap-1 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Suggested:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 whitespace-nowrap transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500 text-white rounded-tr-none font-medium'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Cited Issues (Violet Theme) */}
                  {msg.citedIssues && msg.citedIssues.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-violet-400" /> Grounded Issue Citations:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citedIssues.map((cited) => (
                          <a
                            key={cited.issueNumber}
                            href={cited.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/30 transition"
                          >
                            <span className="font-bold">#{cited.issueNumber}</span>
                            <span className="max-w-[160px] truncate text-xs text-zinc-300 font-sans">
                              {cited.title}
                            </span>
                            {cited.state && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-semibold ${
                                cited.state === 'closed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {cited.state}
                              </span>
                            )}
                            <ExternalLink className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`text-xs text-zinc-400 px-1 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center text-sm text-zinc-500 font-medium">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <RotateCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              RootCauseX RAG engine querying pgvector and synthesizing answer...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#151518]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Ask a question about ${repoOwner}/${repoName}...`}
            className="flex-1 px-4 py-3 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>

    </div>
  );
};
