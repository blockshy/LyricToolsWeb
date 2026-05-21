import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileUploader } from './components/FileUploader';
import { LyricEditor } from './components/LyricEditor';
import { Modal } from './components/Modal';
import { SupportFileType, LyricFile, LyricEntity } from './types';
import { parseLrc, parseSrt, parseQrcXml } from './services/parser';
import { mergeLyrics, exportToLrc, exportToSrt, exportToAss, exportToVtt } from './services/merger';
import { decryptQRC } from './services/qrc';
import { applyLanguage, cleanupLanguageQueryParam, readInitialLanguage, translations, Language } from './services/translations';
import { applyTheme, cleanupThemeQueryParam, readInitialTheme } from './services/theme';
import type { ThemeMode } from './services/theme';
import { FileText, X, Settings2, ArrowRightLeft, Download, Merge, GripVertical, Eye, Moon, Sun, Languages, CircleHelp, Upload, ChevronDown } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => readInitialTheme());
  const [lang, setLang] = useState<Language>(() => readInitialLanguage());
  const [showHelp, setShowHelp] = useState(false);
  const t = translations[lang];

  // Language dropdown
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<LyricFile[]>([]);
  const [mergedLyrics, setMergedLyrics] = useState<LyricEntity[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | 'merged'>('merged');
  const [mergeThreshold, setMergeThreshold] = useState<number>(300);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Drag and Drop State
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  
  // Preview Modal State
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Helper colors for file badges
  const colors = ['bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-slate-500'];

  useEffect(() => {
    applyTheme(theme);
    cleanupThemeQueryParam();
  }, [theme]);

  useEffect(() => {
    applyLanguage(lang);
    cleanupLanguageQueryParam();
  }, [lang]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    if (langOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  // Sidebar Resize Handler
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      // Min 250px, Max 600px
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const handleFilesSelected = async (fileList: File[]) => {
    setIsProcessing(true);
    const newFiles: LyricFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const extension = file.name.split('.').pop()?.toUpperCase();
      let type = SupportFileType.LRC;
      if (extension === 'SRT') type = SupportFileType.SRT;
      if (extension === 'QRC') type = SupportFileType.QRC;

      try {
        let content = '';
        let parsedLyrics: LyricEntity[] = [];

        if (type === SupportFileType.QRC) {
          content = await decryptQRC(file);
          parsedLyrics = parseQrcXml(content);
        } else {
          content = await file.text();
          if (type === SupportFileType.SRT) {
            parsedLyrics = parseSrt(content);
          } else {
            parsedLyrics = parseLrc(content);
          }
        }

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type,
          content,
          parsedLyrics,
          isSelected: true,
          color: colors[(files.length + newFiles.length) % colors.length]
        });
      } catch (e) {
        console.error(`Error reading ${file.name}`, e);
        alert(`Failed to process ${file.name}`);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId('merged');
  };

  const toggleFileSelection = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, isSelected: !f.isSelected } : f));
  };

  const handleViewRaw = (file: LyricFile) => {
    setPreviewTitle(`${file.name} - ${t.rawContent}`);
    setPreviewContent(file.content);
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedFileIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary for onDrop to fire
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedFileIndex === null || draggedFileIndex === dropIndex) return;

    const newFiles = [...files];
    const [movedFile] = newFiles.splice(draggedFileIndex, 1);
    newFiles.splice(dropIndex, 0, movedFile);
    
    setFiles(newFiles);
    setDraggedFileIndex(null);
  };

  // Auto-merge when files or threshold changes
  useEffect(() => {
    // Determine the list of lyrics to merge based on visual order
    const selectedFiles = files.filter(f => f.isSelected);
    if (selectedFiles.length > 0) {
      const lyricsLists = selectedFiles.map(f => f.parsedLyrics);
      const merged = mergeLyrics(lyricsLists, { timeDifference: mergeThreshold });
      setMergedLyrics(merged);
    } else {
      setMergedLyrics([]);
    }
  }, [files, mergeThreshold]);

  const handleExport = (format: 'LRC' | 'SRT' | 'ASS' | 'VTT') => {
    let content = '';
    const activeData = activeFileId === 'merged' 
      ? mergedLyrics 
      : files.find(f => f.id === activeFileId)?.parsedLyrics || [];
      
    const title = activeFileId === 'merged' 
      ? 'Merged Lyrics' 
      : files.find(f => f.id === activeFileId)?.name || 'Lyrics';

    switch(format) {
      case 'LRC': content = exportToLrc(activeData); break;
      case 'SRT': content = exportToSrt(activeData); break;
      case 'ASS': content = exportToAss(activeData, title); break;
      case 'VTT': content = exportToVtt(activeData); break;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_lyrics.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeLyrics = activeFileId === 'merged' 
    ? mergedLyrics 
    : files.find(f => f.id === activeFileId)?.parsedLyrics || [];

  return (
    <div className={`lyric-app h-screen overflow-hidden flex flex-col ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* Header */}
      <header className="tool-shell-header">
        <div className="tool-brand">
          <div className="tool-brand-mark">
             <Merge className="w-5 h-5" />
          </div>
          <h1 className="tool-brand-title">
            {t.appName} <span className="tool-brand-badge">{t.webBadge}</span>
          </h1>
          <button 
            onClick={() => setShowHelp(true)}
            className="tool-icon-button compact"
            title={t.help}
            aria-label={t.help}
          >
            <CircleHelp className="w-5 h-5" />
          </button>
        </div>
        <div className="tool-header-actions">
           <div className="tool-header-group">
              <div className="tool-header-group" style={{ position: 'relative' }} ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="tool-icon-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  aria-label={t.language}
                  aria-expanded={langOpen}
                >
                  <Languages className="w-4 h-4" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{lang.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3" style={{ transition: 'transform 0.2s', transform: langOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {langOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 50,
                    minWidth: '100px', borderRadius: '10px', border: '1px solid var(--surface-border)',
                    padding: '4px', background: 'var(--surface-bg-strong)',
                    boxShadow: 'var(--tool-shadow, 0 16px 40px rgba(0,0,0,0.12))'
                  }}>
                    {(['zh', 'en', 'ja'] as Language[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '6px 10px', fontSize: '13px', borderRadius: '6px',
                          cursor: 'pointer', border: 'none', background: 'transparent',
                          color: lang === l ? 'var(--brand-accent-strong)' : 'var(--app-text)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = lang === l ? 'var(--brand-accent-soft)' : 'var(--control-bg-hover)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = lang === l ? 'var(--brand-accent-soft)' : 'transparent'; }}
                      >
                        {l === 'zh' ? '简体中文' : l === 'en' ? 'English' : '日本語'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="tool-icon-button"
                title={theme === 'dark' ? t.themeLight : t.themeDark}
                aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
           </div>
           
           <div className="export-button-group">
             <button onClick={() => handleExport('LRC')} className="export-format-button" title={t.exportLrc}>LRC</button>
             <button onClick={() => handleExport('SRT')} className="export-format-button" title={t.exportSrt}>SRT</button>
             <button onClick={() => handleExport('ASS')} className="export-format-button" title={t.exportAss}>ASS</button>
             <button onClick={() => handleExport('VTT')} className="export-format-button" title={t.exportVtt}>VTT</button>
           </div>
        </div>
      </header>

      <main className="tool-workspace">
        {/* Sidebar: Files */}
        <div 
          style={{ width: sidebarWidth }}
          className="tool-sidebar"
        >
          {/* Scrollable Area - Takes remaining space */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            <div className="tool-sidebar-section">
              <FileUploader 
                onFilesSelected={handleFilesSelected} 
                title={t.uploadTitle}
                description={t.uploadDesc}
              />
            </div>
            
            <div className="p-4 space-y-3 flex-1">
              <h3 className="tool-eyebrow">{t.workspaceFiles}</h3>

              {files.length === 0 && (
                <div className="tool-empty-state">
                  {t.noFiles}
                </div>
              )}

              {files.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`lyric-file-card group ${
                    activeFileId === file.id
                      ? 'is-active'
                      : ''
                  } ${draggedFileIndex === index ? 'is-dragging' : ''}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <div className="lyric-drag-handle">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div
                    className={`lyric-file-dot ${file.color}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.id);
                    }}
                    title="Toggle for merge"
                  >
                    {!file.isSelected && <div className="lyric-file-dot-off" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="lyric-file-name">{file.name}</p>
                      <span className="lyric-file-type">
                        {file.type}
                      </span>
                    </div>
                    <p className="lyric-file-meta">{file.parsedLyrics.length} {t.lines}</p>
                  </div>

                  <div className="lyric-file-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewRaw(file); }}
                      className="tool-mini-action"
                      title={t.viewingSource}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="tool-mini-action danger"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Controls - Fixed at bottom */}
          <div className="merge-control-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="tool-eyebrow">{t.mergeConfig}</span>
              <Settings2 className="tool-muted-icon w-4 h-4" />
            </div>
            <label className="tool-range-label">
               <span>{t.timeThreshold}</span>
               <span className="font-mono">{mergeThreshold}{t.ms}</span>
            </label>
            <input 
              type="range" 
              min="0"
              max="2000"
              step="50"
              value={mergeThreshold}
              onChange={(e) => setMergeThreshold(Number(e.target.value))}
              className="tool-range"
            />
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`tool-resizer ${
            isResizing
              ? 'is-active'
              : ''
          }`}
        />

        {/* Main Content: Editor */}
        <div className="tool-editor-pane">
          <div className="tool-editor-toolbar">
             <div className="flex items-center gap-4">
               <button
                 onClick={() => setActiveFileId('merged')}
                 className={`merged-output-button ${
                   activeFileId === 'merged'
                     ? 'is-active'
                     : ''
                 }`}
               >
                 <ArrowRightLeft className="w-4 h-4" />
                 {t.mergedOutput}
               </button>
               {activeFileId !== 'merged' && (
                 <span className="source-indicator animate-in fade-in slide-in-from-left-2">
                   <span className="source-indicator-dot" />
                   {t.viewingSource}: <span>{files.find(f => f.id === activeFileId)?.name}</span>
                 </span>
               )}
             </div>
             
             <div className="tool-line-count">
                {activeLyrics.length} {t.lines}
             </div>
          </div>

          <div className="flex-1 relative min-h-0">
            <LyricEditor 
              lyrics={activeLyrics} 
              readOnly={activeFileId === 'merged'} 
              emptyText={t.noFiles}
              onUpdate={(newLyrics) => {
                if (activeFileId !== 'merged') {
                  setFiles(files.map(f => f.id === activeFileId ? { ...f, parsedLyrics: newLyrics } : f));
                }
              }}
            />
          </div>
        </div>
      </main>

      <Modal 
        isOpen={previewContent !== null} 
        onClose={() => setPreviewContent(null)}
        title={previewTitle}
        closeText={t.close}
        type="preview"
      >
        {previewContent}
      </Modal>

      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title={t.helpTitle}
        closeText={t.close}
        type="custom"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
           <div className="flex gap-4 items-start">
	             <div className="help-icon-box">
	               <Upload className="w-5 h-5" />
	             </div>
	             <div>
	               <h4 className="help-item-title">{t.helpUpload}</h4>
	               <p className="help-item-copy">{t.helpUploadDesc}</p>
	             </div>
           </div>

           <div className="flex gap-4 items-start">
	             <div className="help-icon-box">
	               <GripVertical className="w-5 h-5" />
	             </div>
	             <div>
	               <h4 className="help-item-title">{t.helpManage}</h4>
	               <p className="help-item-copy">{t.helpManageDesc}</p>
	             </div>
           </div>

           <div className="flex gap-4 items-start">
	             <div className="help-icon-box">
	               <FileText className="w-5 h-5" />
	             </div>
	             <div>
	               <h4 className="help-item-title">{t.helpEdit}</h4>
	               <p className="help-item-copy">{t.helpEditDesc}</p>
	             </div>
           </div>

           <div className="flex gap-4 items-start">
	             <div className="help-icon-box">
	               <Merge className="w-5 h-5" />
	             </div>
	             <div>
	               <h4 className="help-item-title">{t.helpMerge}</h4>
	               <p className="help-item-copy">{t.helpMergeDesc}</p>
	             </div>
           </div>

           <div className="flex gap-4 items-start md:col-span-2">
	             <div className="help-icon-box">
	               <Download className="w-5 h-5" />
	             </div>
	             <div>
	               <h4 className="help-item-title">{t.helpExport}</h4>
	               <p className="help-item-copy">{t.helpExportDesc}</p>
	             </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}
