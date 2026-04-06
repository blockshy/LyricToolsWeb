import React from 'react';
import { LyricEntity } from '../types';
import { Clock, Hash, Hourglass, Trash2, RotateCcw } from 'lucide-react';
import { formatLrcTime, parseTimeInput } from '../services/merger';

interface LyricEditorProps {
  lyrics: LyricEntity[];
  onUpdate?: (newLyrics: LyricEntity[]) => void;
  readOnly?: boolean;
  emptyText: string;
}

export const LyricEditor: React.FC<LyricEditorProps> = ({ lyrics, onUpdate, readOnly = false, emptyText }) => {
  
  const handleTimeChange = (idx: number, field: 'startTimeMs' | 'endTimeMs', value: string) => {
    if (!onUpdate) return;
    
    const ms = parseTimeInput(value);
    if (ms !== null) {
      const newLyrics = [...lyrics];
      newLyrics[idx] = { ...newLyrics[idx], [field]: ms };
      // If updating start time, sort the list? 
      // Usually editors keep index stable until explicit save, but for lyrics time sorting is crucial.
      // However, auto-sorting while typing might jump rows. 
      // For now, we update in place. The merger sorts naturally or requires sorted input.
      // Let's assume user edits carefully.
      onUpdate(newLyrics);
    } else {
      // Invalid input, force re-render to reset value to formatted time
      onUpdate([...lyrics]);
    }
  };

  const toggleDelete = (idx: number) => {
    if (!onUpdate) return;
    const newLyrics = [...lyrics];
    newLyrics[idx] = { ...newLyrics[idx], isDeleted: !newLyrics[idx].isDeleted };
    onUpdate(newLyrics);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <div className="flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 dark:text-slate-400 select-none shrink-0">
        <div className="w-10 flex items-center justify-center shrink-0">
          <Hash className="w-3 h-3" />
        </div>
        <div className="w-24 flex items-center gap-1 shrink-0 justify-center">
          <Clock className="w-3 h-3" />
          <span>Start</span>
        </div>
        <div className="w-24 flex items-center gap-1 shrink-0 justify-center">
          <Hourglass className="w-3 h-3" />
          <span>End</span>
        </div>
        <div className="flex-1 pl-2">Content</div>
        {!readOnly && <div className="w-10 flex justify-center">Action</div>}
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0">
        {lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <p>{emptyText}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lyrics.map((line, idx) => {
              const isDeleted = line.isDeleted;
              return (
                <div 
                  key={line.id || idx} 
                  className={`flex group transition-colors ${
                    isDeleted 
                      ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Index */}
                  <div className={`w-10 px-2 py-3 font-mono text-xs select-none flex items-center justify-center shrink-0 ${
                    isDeleted ? 'text-red-300 dark:text-red-800' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Start Time */}
                  <div className="w-24 px-2 py-3 flex items-center justify-center shrink-0">
                    {readOnly ? (
                      <span className={`font-mono text-xs ${isDeleted ? 'text-slate-400 line-through' : 'text-blue-600 dark:text-blue-400'}`}>
                        {formatLrcTime(line.startTimeMs)}
                      </span>
                    ) : (
                      <input 
                        type="text"
                        className={`w-full bg-transparent text-center font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-blue-500 transition-colors ${
                          isDeleted ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-blue-600 dark:text-blue-400'
                        }`}
                        defaultValue={formatLrcTime(line.startTimeMs)}
                        onBlur={(e) => handleTimeChange(idx, 'startTimeMs', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        key={`start-${line.startTimeMs}`} // Force re-render on external update
                        disabled={isDeleted}
                      />
                    )}
                  </div>

                  {/* End Time */}
                  <div className="w-24 px-2 py-3 flex items-center justify-center shrink-0">
                    {readOnly ? (
                      <span className={`font-mono text-xs ${isDeleted ? 'text-slate-400 line-through' : 'text-slate-400 dark:text-slate-500'}`}>
                        {line.endTimeMs ? formatLrcTime(line.endTimeMs) : '-'}
                      </span>
                    ) : (
                      <input 
                        type="text"
                        className={`w-full bg-transparent text-center font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-blue-500 transition-colors ${
                          isDeleted ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-400'
                        }`}
                        defaultValue={line.endTimeMs ? formatLrcTime(line.endTimeMs) : ''}
                        placeholder="-"
                        onBlur={(e) => handleTimeChange(idx, 'endTimeMs', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        key={`end-${line.endTimeMs}`}
                        disabled={isDeleted}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4 py-3 text-sm leading-relaxed min-w-0">
                     {readOnly ? (
                        <div className={`whitespace-pre-wrap ${isDeleted ? 'text-slate-400 dark:text-slate-600 line-through decoration-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {line.text}
                        </div>
                     ) : (
                       <textarea 
                          className={`w-full bg-transparent resize-none focus:outline-none placeholder-slate-400 ${
                            isDeleted 
                              ? 'text-slate-400 dark:text-slate-600 line-through decoration-slate-400 cursor-not-allowed' 
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                          rows={Math.max(1, line.text.split('\n').length)}
                          defaultValue={line.text}
                          onBlur={(e) => {
                            if (onUpdate && !isDeleted) {
                              const newLyrics = [...lyrics];
                              newLyrics[idx] = { ...line, text: e.target.value };
                              onUpdate(newLyrics);
                            }
                          }}
                          disabled={isDeleted}
                       />
                     )}
                  </div>

                  {/* Actions */}
                  {!readOnly && (
                    <div className="w-10 flex items-center justify-center shrink-0 border-l border-slate-100 dark:border-slate-800/50">
                      <button 
                        onClick={() => toggleDelete(idx)}
                        className={`p-1.5 rounded transition-all ${
                          isDeleted 
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                        title={isDeleted ? "Restore" : "Delete"}
                      >
                        {isDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};