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
    <div className="lyric-editor">
      <div className="lyric-editor-header">
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
      
      <div className="lyric-editor-body">
        {lyrics.length === 0 ? (
          <div className="lyric-editor-empty">
            <p>{emptyText}</p>
          </div>
        ) : (
          <div>
            {lyrics.map((line, idx) => {
              const isDeleted = line.isDeleted;
              return (
                <div 
                  key={line.id || idx} 
                  className={`lyric-editor-row group${isDeleted ? ' is-deleted' : ''}`}
                >
                  {/* Index */}
                  <div className="lyric-index-cell">
                    {idx + 1}
                  </div>

                  {/* Start Time */}
                  <div className="lyric-time-cell">
                    {readOnly ? (
                      <span className={`lyric-time-text${isDeleted ? ' is-deleted' : ''}`}>
                        {formatLrcTime(line.startTimeMs)}
                      </span>
                    ) : (
                      <input 
                        type="text"
                        className={`lyric-time-input${isDeleted ? ' is-deleted' : ''}`}
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
                  <div className="lyric-time-cell">
                    {readOnly ? (
                      <span className={`lyric-time-text secondary${isDeleted ? ' is-deleted' : ''}`}>
                        {line.endTimeMs ? formatLrcTime(line.endTimeMs) : '-'}
                      </span>
                    ) : (
                      <input 
                        type="text"
                        className={`lyric-time-input secondary${isDeleted ? ' is-deleted' : ''}`}
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
                  <div className="lyric-content-cell">
                     {readOnly ? (
                        <div className={`lyric-line-text${isDeleted ? ' is-deleted' : ''}`}>
                          {line.text}
                        </div>
                     ) : (
                       <textarea 
                          className={`lyric-content-input${isDeleted ? ' is-deleted cursor-not-allowed' : ''}`}
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
                    <div className="lyric-action-cell">
                      <button 
                        onClick={() => toggleDelete(idx)}
                        className={`lyric-row-action${isDeleted ? ' restore' : ''}`}
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
