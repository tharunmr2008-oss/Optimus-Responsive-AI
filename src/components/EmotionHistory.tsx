import { useState } from 'react';
import { EmotionHistoryItem, EmotionName } from '../types';
import { EMOTION_CONFIGS } from '../constants/emotions';
import {
  History,
  Trash2,
  Download,
  Clock,
  Filter
} from 'lucide-react';

interface EmotionHistoryProps {
  history: EmotionHistoryItem[];
  onClearHistory: () => void;
}

export function EmotionHistory({ history, onClearHistory }: EmotionHistoryProps) {
  const [filter, setFilter] = useState<EmotionName | 'all'>('all');

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(item => item.emotion === filter);

  // Compute emotion breakdown stats
  const emotionCounts = history.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {} as Record<EmotionName, number>);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const rows = [
      ['Timestamp', 'Emotion', 'Confidence', 'Response'],
      ...history.map(item => [
        item.timestamp.toISOString(),
        item.emotion,
        `${item.confidence}%`,
        `"${item.serviceResponse.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `optimus_prime_session_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      id="interaction-history"
      className="glass-panel-glow rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl transition-all"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Emotion & Interaction History
            </h3>
            <p className="text-xs text-slate-400">
              Chronological ledger of detected facial expressions and empathy guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportCSV}
                title="Export session logs to CSV"
                className="btn-interactive inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={onClearHistory}
                title="Clear history"
                className="btn-interactive inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Badges Bar */}
      {history.length > 0 && (
        <div className="px-5 py-2.5 bg-white/[0.01] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-indigo-400" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`btn-interactive px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All ({history.length})
          </button>
          {Object.entries(emotionCounts).map(([emo, count]) => {
            const cfg = EMOTION_CONFIGS[emo as EmotionName];
            return (
              <button
                key={emo}
                type="button"
                onClick={() => setFilter(emo as EmotionName)}
                className={`btn-interactive px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer ${
                  filter === emo
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cfg.emoji}</span>
                <span className="capitalize">{emo}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* History Items List */}
      <div className="p-4 sm:p-5">
        {history.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2.5 text-slate-600" />
            <p className="text-xs font-semibold text-slate-300">No emotions recorded yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Start the camera stream to log real-time facial sentiments and see chronological insights here.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredHistory.map((item) => {
              const config = EMOTION_CONFIGS[item.emotion];
              return (
                <div
                  key={item.id}
                  className="btn-interactive p-3 flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] rounded-2xl transition-all text-xs"
                >
                  {/* Timestamp & Emotion Badge */}
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${config.bgColor}`}
                    >
                      <span>{config.emoji}</span>
                      <span className="capitalize">{config.name}</span>
                    </span>
                  </div>

                  {/* Customer Service Response snippet */}
                  <div className="hidden md:block flex-1 text-slate-400 truncate text-[11px]">
                    &ldquo;{item.serviceResponse}&rdquo;
                  </div>

                  {/* Confidence Meter */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-20 bg-white/5 border border-white/5 rounded-full h-1.5 overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.confidence}%`,
                          backgroundColor: config.color
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold text-indigo-300 min-w-[36px] text-right">
                      {item.confidence}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History Summary Footer */}
      {history.length > 0 && (
        <div className="px-5 py-3 bg-[#07080f]/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span>
            Total Logged Events: <strong className="text-white font-mono">{history.length}</strong>
          </span>
          <span className="text-[11px] text-slate-500">
            Recorded locally in active browser session
          </span>
        </div>
      )}
    </section>
  );
}
