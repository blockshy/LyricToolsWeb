export type Language = 'zh' | 'en';

export const languageStorageKey = 'lyric-tools-lang';

export function isLanguage(value: string | null): value is Language {
  return value === 'zh' || value === 'en';
}

function normalizeLanguage(value: string | null): Language | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-')) {
    return 'zh';
  }
  if (normalized === 'en' || normalized === 'en-us' || normalized.startsWith('en-')) {
    return 'en';
  }
  return null;
}

export function readInitialLanguage(storageKey = languageStorageKey): Language {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const url = new URL(window.location.href);
  const urlLanguage = normalizeLanguage(url.searchParams.get('lang') || url.searchParams.get('locale'));
  if (urlLanguage) {
    return urlLanguage;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (isLanguage(stored)) {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function applyLanguage(language: Language, storageKey = languageStorageKey) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  window.localStorage.setItem(storageKey, language);
}

export function cleanupLanguageQueryParam() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const hasValidLanguage = Boolean(
    normalizeLanguage(url.searchParams.get('lang')) || normalizeLanguage(url.searchParams.get('locale')),
  );
  if (!hasValidLanguage) {
    return;
  }

  url.searchParams.delete('lang');
  url.searchParams.delete('locale');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export const translations = {
  zh: {
    appName: "歌词工具",
    webBadge: "WEB版",
    uploadTitle: "点击上传或拖拽文件",
    uploadDesc: "支持 LRC, SRT, QRC, TXT",
    workspaceFiles: "工作区文件",
    noFiles: "暂无文件",
    mergeConfig: "合并设置",
    timeThreshold: "时间阈值",
    mergedOutput: "合并输出",
    viewingSource: "查看源文件",
    lines: "行",
    exportLrc: "导出 LRC",
    exportSrt: "导出 SRT",
    exportAss: "导出 ASS",
    exportVtt: "导出 VTT",
    close: "关闭",
    rawContent: "原始内容",
    processing: "处理中...",
    ms: "毫秒",
    theme: "主题",
    language: "语言",
    themeLight: "切换到浅色模式",
    themeDark: "切换到深色模式",
    help: "使用说明",
    helpTitle: "功能介绍",
    helpUpload: "导入文件",
    helpUploadDesc: "支持 .lrc, .srt, .qrc (QQ音乐自动解密), .txt 格式。支持多选和拖拽。",
    helpManage: "管理列表",
    helpManageDesc: "拖拽调整顺序，顺序影响合并结果。点击色点切换启用状态。点击眼睛图标查看原文。",
    helpEdit: "编辑预览",
    helpEditDesc: "左键点击修改内容/时间。右侧按钮删除不需要的行（不参与合并）。",
    helpMerge: "合并设置",
    helpMergeDesc: "调整左侧底部的“时间阈值”，将相近时间的歌词合并为多行。",
    helpExport: "导出保存",
    helpExportDesc: "选择需要的格式导出合并后的结果。"
  },
  en: {
    appName: "LyricTools",
    webBadge: "WEB",
    uploadTitle: "Click to upload or drag & drop",
    uploadDesc: "Supports LRC, SRT, QRC, TXT",
    workspaceFiles: "Workspace Files",
    noFiles: "No files loaded",
    mergeConfig: "Merge Config",
    timeThreshold: "Time Threshold",
    mergedOutput: "Merged Output",
    viewingSource: "Viewing Source",
    lines: "Lines",
    exportLrc: "Export LRC",
    exportSrt: "Export SRT",
    exportAss: "Export ASS",
    exportVtt: "Export VTT",
    close: "Close",
    rawContent: "Raw Content",
    processing: "Processing...",
    ms: "ms",
    theme: "Theme",
    language: "Language",
    themeLight: "Switch to Light Mode",
    themeDark: "Switch to Dark Mode",
    help: "Help",
    helpTitle: "Usage Guide",
    helpUpload: "Import Files",
    helpUploadDesc: "Click or drag to upload LRC, SRT, QRC (auto-decrypt), TXT.",
    helpManage: "Manage List",
    helpManageDesc: "Drag to reorder (affects merge order). Click dot to toggle. Click eye to view raw.",
    helpEdit: "Edit & Preview",
    helpEditDesc: "Click text/time to edit. Use delete button to exclude lines from export.",
    helpMerge: "Merge Config",
    helpMergeDesc: "Adjust 'Time Threshold' at the bottom to group lyrics with similar timestamps.",
    helpExport: "Export",
    helpExportDesc: "Download result in your preferred format."
  }
};
