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
    <div className="flex flex-col h-[600px] rounded-xl border border-[#E8E3DC] dark:border-[#2E2C36] bg-[#FFFFFF] dark:bg-[#1F1E24] shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/70 dark:bg-[#16151A]/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#25242B] dark:text-[#F5F2ED] flex items-center gap-2">
              Ask Your Repo (RAG Assistant)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] border border-[#7654C8]/25 font-semibold">
                pgvector RAG
              </span>
            </h3>
            <p className="text-[11px] text-[#77727C] dark:text-[#9E98A6]">
              Grounded repository contextual knowledge over {repoOwner}/{repoName}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="px-4 py-2 border-b border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/40 dark:bg-[#16151A]/40 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E98A6] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#E98245]" /> Suggestions:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#FFFFFF] dark:bg-[#1F1E24] hover:bg-[#EFEBE5] dark:hover:bg-[#282630] text-[#77727C] dark:text-[#9E98A6] border border-[#E8E3DC] dark:border-[#2E2C36] whitespace-nowrap transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#7654C8]/10 text-[#7654C8] dark:text-[#916FE0] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-xl sm:max-w-2xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#25242B] dark:bg-[#F5F2ED] text-[#F5F2ED] dark:text-[#25242B] rounded-tr-none font-medium'
                      : 'bg-[#F5F2ED] dark:bg-[#16151A] text-[#25242B] dark:text-[#F5F2ED] rounded-tl-none border border-[#E8E3DC] dark:border-[#2E2C36]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Cited Issues (Violet Theme) */}
                  {msg.citedIssues && msg.citedIssues.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#E8E3DC] dark:border-[#2E2C36] space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-[#7654C8] dark:text-[#916FE0] uppercase tracking-wider flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-[#7654C8]" /> Grounded Issue Citations:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citedIssues.map((cited) => (
                          <a
                            key={cited.issueNumber}
                            href={cited.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-[#FFFFFF] dark:bg-[#1F1E24] text-[#7654C8] dark:text-[#916FE0] hover:bg-[#7654C8]/10 border border-[#7654C8]/25 transition"
                          >
                            <span className="font-bold">#{cited.issueNumber}</span>
                            <span className="max-w-[120px] truncate text-[11px] text-[#77727C] dark:text-[#9E98A6]">
                              {cited.title}
                            </span>
                            {cited.state && (
                              <span className="text-[10px] uppercase font-bold text-[#77727C]">
                                {cited.state}
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] text-[#9E98A6] font-mono px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#25242B] dark:bg-[#F5F2ED] text-[#F5F2ED] dark:text-[#25242B] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 justify-start items-center text-xs text-[#77727C] dark:text-[#9E98A6] font-mono">
            <div className="w-7 h-7 rounded-lg bg-[#7654C8]/10 text-[#7654C8] flex items-center justify-center shrink-0">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-lg bg-[#F5F2ED] dark:bg-[#16151A] border border-[#E8E3DC] dark:border-[#2E2C36]">
              RootCauseX vector similarity retrieval in progress...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-[#E8E3DC] dark:border-[#2E2C36] bg-[#F5F2ED]/60 dark:bg-[#16151A]/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Ask a question about ${repoOwner}/${repoName}...`}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-[#FFFFFF] dark:bg-[#1F1E24] border border-[#E8E3DC] dark:border-[#2E2C36] rounded-lg text-[#25242B] dark:text-[#F5F2ED] placeholder-[#9E98A6] focus:outline-none focus:ring-1 focus:ring-[#7654C8] focus:border-[#7654C8]"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="px-3.5 py-2 rounded-lg bg-[#7654C8] hover:bg-[#6342B2] disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-98 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>

    </div>
  );
};
