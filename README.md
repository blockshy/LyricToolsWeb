# LyricToolsWeb

## 中文说明

LyricToolsWeb 是一个面向歌词文件处理的前端工具，支持解析、解密、合并和导出多种歌词格式。项目基于浏览器本地处理流程，适合整理歌词文件、合并双语歌词以及转换字幕格式。

项目部署网站：<https://lyrics.tyukki.com>

### 功能特性

- 支持导入 `LRC`、`SRT`、`QRC`
- 支持解析 QQ 音乐本地加密 `QRC`
- 支持按时间阈值合并多份歌词
- 支持文件拖拽排序与选择性合并
- 支持导出为 `LRC`、`SRT`、`ASS`、`VTT`
- 支持原文预览、编辑视图、深浅色主题和中英双语界面

### 技术栈

- React 19
- TypeScript
- Vite
- `lucide-react`

### 本地运行

```bash
npm install
npm run dev
```

### 构建生产版本

```bash
npm run build
npm run preview
```

### 目录结构

```text
components/            上传、编辑器、弹窗等界面组件
services/
  parser.ts            LRC / SRT / QRC 解析
  qrc.ts               QRC 解密
  merger.ts            合并与导出逻辑
  translations.ts      中英文本
App.tsx                主界面与交互流程
types.ts               核心类型定义
```

### 适用场景

- 合并原文与翻译歌词
- 将歌词转换为字幕格式
- 处理和检查本地 QRC 歌词文件

---

## English

LyricToolsWeb is a browser-based lyric processing tool for parsing, decrypting, merging, and exporting multiple lyric formats. It is designed for local file workflows and works well for bilingual lyric merging and subtitle conversion.

Project deployment website: <https://lyrics.tyukki.com>

### Features

- Import `LRC`, `SRT`, and `QRC`
- Decrypt local encrypted QQ Music `QRC` files
- Merge multiple lyric files with a configurable time threshold
- Reorder files by drag and drop and merge only selected items
- Export to `LRC`, `SRT`, `ASS`, and `VTT`
- Includes raw preview, editor view, dark/light theme, and Chinese/English UI

### Tech Stack

- React 19
- TypeScript
- Vite
- `lucide-react`

### Run Locally

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Project Structure

```text
components/            Upload, editor, modal, and UI components
services/
  parser.ts            LRC / SRT / QRC parsing
  qrc.ts               QRC decryption
  merger.ts            Merge and export logic
  translations.ts      Chinese and English text resources
App.tsx                Main app flow
types.ts               Core type definitions
```

### Use Cases

- Merge original and translated lyrics
- Convert lyrics into subtitle formats
- Process and inspect local QRC lyric files
