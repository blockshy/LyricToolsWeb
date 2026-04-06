import React, { useState, useEffect, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { LyricEditor } from './components/LyricEditor';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { SupportFileType, LyricFile, LyricEntity } from './types';
import { parseLrc, parseSrt, parseQrcXml } from './services/parser';
import { mergeLyrics, exportToLrc, exportToSrt, exportToAss, exportToVtt } from './services/merger';
import { decryptQRC } from './services/qrc';
import { translations, Language } from './services/translations';
import { FileText, X, Settings2, ArrowRightLeft, Download, Merge, GripVertical, Eye, Moon, Sun, Languages, CircleHelp, Upload } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<Language>('zh');
  const [showHelp, setShowHelp] = useState(false);
  const t = translations[lang];

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
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];

  // Effect to apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
    <div className={`h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-200 ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
             <Merge className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            {t.appName} <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-normal">{t.webBadge}</span>
          </h1>
          <button 
            onClick={() => setShowHelp(true)}
            className="ml-1 p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title={t.help}
          >
            <CircleHelp className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex gap-1 border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
             <button 
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={lang === 'zh' ? 'Switch to English' : '切换中文'}
             >
                <Languages className="w-4 h-4" />
             </button>
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? t.themeLight : t.themeDark}
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
           </div>
           
           <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <button onClick={() => handleExport('LRC')} className="px-2 py-1 text-xs font-medium hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-300" title={t.exportLrc}>LRC</button>
             <button onClick={() => handleExport('SRT')} className="px-2 py-1 text-xs font-medium hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-300" title={t.exportSrt}>SRT</button>
             <button onClick={() => handleExport('ASS')} className="px-2 py-1 text-xs font-medium hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-300" title={t.exportAss}>ASS</button>
             <button onClick={() => handleExport('VTT')} className="px-2 py-1 text-xs font-medium hover:bg-white dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-300" title={t.exportVtt}>VTT</button>
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Files */}
        <div 
          style={{ width: sidebarWidth }}
          className="bg-white dark:bg-slate-900 flex flex-col h-full shrink-0"
        >
          {/* Scrollable Area - Takes remaining space */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <FileUploader 
                onFilesSelected={handleFilesSelected} 
                title={t.uploadTitle}
                description={t.uploadDesc}
              />
            </div>
            
            <div className="p-4 space-y-3 flex-1">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">{t.workspaceFiles}</h3>
              
              {files.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
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
                  className={`group flex items-center p-3 rounded-lg border transition-all cursor-pointer select-none ${
                    activeFileId === file.id 
                    ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-500/50 shadow-sm' 
                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  } ${draggedFileIndex === index ? 'opacity-50 border-dashed border-blue-400' : ''}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 mr-2 hover:text-slate-500 dark:hover:text-slate-400">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div 
                    className={`w-2 h-2 rounded-full mr-3 ${file.color} cursor-pointer hover:ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 shrink-0`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.id);
                    }}
                    title="Toggle for merge"
                  >
                    {!file.isSelected && <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded ml-2">
                        {file.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{file.parsedLyrics.length} {t.lines}</p>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleViewRaw(file); }}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all mr-1"
                      title={t.viewingSource}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{t.mergeConfig}</span>
              <Settings2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2 flex justify-between">
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
              className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`w-1 cursor-col-resize z-20 transition-colors shrink-0 ${
            isResizing 
              ? 'bg-blue-600' 
              : 'bg-slate-200 dark:bg-slate-800 hover:bg-blue-400 dark:hover:bg-blue-500'
          }`}
        />

        {/* Main Content: Editor */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setActiveFileId('merged')}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                   activeFileId === 'merged' 
                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20' 
                   : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-transparent'
                 }`}
               >
                 <ArrowRightLeft className="w-4 h-4" />
                 {t.mergedOutput}
               </button>
               {activeFileId !== 'merged' && (
                 <span className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                   <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
                   {t.viewingSource}: <span className="font-medium text-slate-700 dark:text-slate-300">{files.find(f => f.id === activeFileId)?.name}</span>
                 </span>
               )}
             </div>
             
             <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
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
             <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <Upload className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t.helpUpload}</h4>
               <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.helpUploadDesc}</p>
             </div>
           </div>

           <div className="flex gap-4 items-start">
             <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
               <GripVertical className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t.helpManage}</h4>
               <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.helpManageDesc}</p>
             </div>
           </div>

           <div className="flex gap-4 items-start">
             <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <FileText className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t.helpEdit}</h4>
               <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.helpEditDesc}</p>
             </div>
           </div>

           <div className="flex gap-4 items-start">
             <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
               <Merge className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t.helpMerge}</h4>
               <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.helpMergeDesc}</p>
             </div>
           </div>

           <div className="flex gap-4 items-start md:col-span-2">
             <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
               <Download className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{t.helpExport}</h4>
               <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t.helpExportDesc}</p>
             </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}