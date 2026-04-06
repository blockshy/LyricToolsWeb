export enum SupportFileType {
  LRC = 'LRC',
  SRT = 'SRT',
  QRC = 'QRC', // Encrypted QQ Music
  TXT = 'TXT'
}

export interface LyricEntity {
  id: string; // Internal unique ID for React keys
  startTimeMs: number;
  endTimeMs?: number;
  text: string;
  isTranslated?: boolean;
  isDeleted?: boolean; // User marked for deletion
}

export interface LyricFile {
  id: string;
  name: string;
  type: SupportFileType;
  content: string; // Raw text content (or base64 for binary if needed, but we process to string)
  parsedLyrics: LyricEntity[];
  isSelected: boolean;
  color?: string; // UI color for identification
}

export interface MergeConfig {
  timeDifference: number; // ms
}