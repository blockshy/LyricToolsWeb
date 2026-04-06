import { LyricEntity, MergeConfig } from '../types';
import { generateId } from './parser';

/**
 * Merges multiple lyric lists into one.
 * Uses a "multi-pointer" approach where we group lyrics that fall within a time threshold.
 */
export const mergeLyrics = (
  lyricLists: LyricEntity[][],
  config: MergeConfig
): LyricEntity[] => {
  // Filter out deleted lyrics before merging
  const activeLists = lyricLists.map(list => list.filter(l => !l.isDeleted));
  
  if (activeLists.length === 0) return [];
  if (activeLists.length === 1) return activeLists[0];

  const merged: LyricEntity[] = [];
  const pointers = new Array(activeLists.length).fill(0);
  
  // Calculate total number of items to process to avoid infinite loops
  const totalItems = activeLists.reduce((acc, list) => acc + list.length, 0);
  let processedItems = 0;

  while (true) {
    // 1. Find the earliest start time among current pointers
    let minTime = Number.MAX_SAFE_INTEGER;
    let hasUnprocessed = false;

    for (let i = 0; i < activeLists.length; i++) {
      if (pointers[i] < activeLists[i].length) {
        hasUnprocessed = true;
        const time = activeLists[i][pointers[i]].startTimeMs;
        if (time < minTime) {
          minTime = time;
        }
      }
    }

    if (!hasUnprocessed) break;

    // 2. Collect all items within the threshold of minTime
    const currentGroup: { text: string; startTime: number; endTime?: number }[] = [];
    
    let groupMinStart = minTime;
    let groupMaxEnd = 0;

    for (let i = 0; i < activeLists.length; i++) {
      // Check if current pointer for this list is within range
      // We might advance multiple items from one list if they are all within the short range?
      // The PDF implies "finding closest items". We will take ONE item per list if it matches time.
      
      if (pointers[i] < activeLists[i].length) {
        const item = activeLists[i][pointers[i]];
        
        // Check if this item belongs to the current time group
        // If absolute difference is within threshold
        if (Math.abs(item.startTimeMs - minTime) <= config.timeDifference) {
          currentGroup.push({
            text: item.text,
            startTime: item.startTimeMs,
            endTime: item.endTimeMs
          });
          
          if (item.endTimeMs && item.endTimeMs > groupMaxEnd) {
             groupMaxEnd = item.endTimeMs;
          }
          
          pointers[i]++; // Advance pointer for this list
          processedItems++;
        }
      }
    }

    // 3. Create merged entity
    if (currentGroup.length > 0) {
      const combinedText = currentGroup.map(g => g.text).join('\n');
      
      // If we didn't get an explicit end time, estimate it or leave undefined
      // For LRC export, end time isn't strictly needed.
      const entity: LyricEntity = {
        id: generateId(),
        startTimeMs: groupMinStart,
        text: combinedText
      };

      if (groupMaxEnd > 0) {
        entity.endTimeMs = groupMaxEnd;
      }

      merged.push(entity);
    } else {
        // Safety break if logic fails to advance pointers
        break;
    }
  }

  return merged;
};

/**
 * Format timestamp to [MM:SS.xx] for LRC
 */
export const formatLrcTime = (ms: number): string => {
  if (isNaN(ms) || ms < 0) return "00:00.00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `[${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}]`;
};

/**
 * Helper to parse time string back to milliseconds.
 * Supports: 
 * - [MM:SS.xx]
 * - MM:SS.xx
 * - MM:SS
 * - SS.xx (treated as seconds)
 */
export const parseTimeInput = (input: string): number | null => {
  if (!input) return null;
  const clean = input.replace(/[\[\]]/g, '').trim();
  
  // Try MM:SS.xx or MM:SS
  const colons = clean.split(':');
  if (colons.length === 2) {
    const min = parseFloat(colons[0]);
    const secStr = colons[1];
    const sec = parseFloat(secStr);
    if (!isNaN(min) && !isNaN(sec)) {
      return (min * 60 * 1000) + (sec * 1000);
    }
  } else if (colons.length === 3) {
    const h = parseFloat(colons[0]);
    const m = parseFloat(colons[1]);
    const s = parseFloat(colons[2]);
    return (h * 3600 * 1000) + (m * 60 * 1000) + (s * 1000);
  } else {
    // Treat as seconds if just a number
    const val = parseFloat(clean);
    if (!isNaN(val)) {
      return val * 1000;
    }
  }
  return null;
}

/**
 * Format timestamp to HH:MM:SS,mmm for SRT
 */
export const formatSrtTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  const pad = (n: number, w: number = 2) => n.toString().padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};

/**
 * Convert LyricEntities to LRC String
 * Handles multiline text by creating separate tags for each line with the same timestamp.
 */
export const exportToLrc = (lyrics: LyricEntity[]): string => {
  return lyrics
    .filter(l => !l.isDeleted)
    .flatMap(l => {
      // Split multiline text and create a timestamped line for each
      const lines = l.text.split('\n');
      return lines.map(line => `${formatLrcTime(l.startTimeMs)}${line}`);
    })
    .join('\n');
};

/**
 * Convert LyricEntities to SRT String
 */
export const exportToSrt = (lyrics: LyricEntity[]): string => {
  const activeLyrics = lyrics.filter(l => !l.isDeleted);
  return activeLyrics.map((l, index) => {
    // Determine end time: use existing, or next start time - 100ms, or start + 5000ms
    let end = l.endTimeMs;
    if (!end) {
      if (index < activeLyrics.length - 1) {
        end = Math.max(l.startTimeMs + 1000, activeLyrics[index + 1].startTimeMs - 100);
      } else {
        end = l.startTimeMs + 5000;
      }
    }
    
    return `${index + 1}\n${formatSrtTime(l.startTimeMs)} --> ${formatSrtTime(end)}\n${l.text}\n`;
  }).join('\n');
};

/**
 * Format timestamp to H:MM:SS.cs for ASS
 */
export const formatAssTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
};

/**
 * Convert LyricEntities to ASS String
 */
export const exportToAss = (lyrics: LyricEntity[], title: string = 'Untitled'): string => {
  const activeLyrics = lyrics.filter(l => !l.isDeleted);
  
  const header = `[Script Info]
; Script generated by LyricTools Web
Title: ${title}
ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,50,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = activeLyrics.map((l, index) => {
    let end = l.endTimeMs;
    if (!end) {
      if (index < activeLyrics.length - 1) {
        end = Math.max(l.startTimeMs + 1000, activeLyrics[index + 1].startTimeMs - 100);
      } else {
        end = l.startTimeMs + 5000;
      }
    }
    // Escape newlines for ASS
    const text = l.text.replace(/\n/g, '\\N');
    return `Dialogue: 0,${formatAssTime(l.startTimeMs)},${formatAssTime(end)},Default,,0,0,0,,${text}`;
  }).join('\n');

  return header + events;
};

/**
 * Convert LyricEntities to VTT String
 */
export const exportToVtt = (lyrics: LyricEntity[]): string => {
  const activeLyrics = lyrics.filter(l => !l.isDeleted);
  const body = activeLyrics.map((l, index) => {
    let end = l.endTimeMs;
    if (!end) {
      if (index < activeLyrics.length - 1) {
        end = Math.max(l.startTimeMs + 1000, activeLyrics[index + 1].startTimeMs - 100);
      } else {
        end = l.startTimeMs + 5000;
      }
    }
    
    // VTT time format: HH:MM:SS.mmm
    // Reuse SRT format but ensure dot for milliseconds
    const startStr = formatSrtTime(l.startTimeMs).replace(',', '.');
    const endStr = formatSrtTime(end).replace(',', '.');
    
    return `${startStr} --> ${endStr}\n${l.text}`;
  }).join('\n\n');

  return `WEBVTT\n\n${body}`;
};