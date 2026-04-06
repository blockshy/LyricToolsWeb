import { LyricEntity } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Helper to group lyrics that have the exact same start time.
 * Merges text with newlines.
 */
const groupSameTimeLyrics = (lyrics: LyricEntity[]): LyricEntity[] => {
  if (lyrics.length === 0) return [];
  
  // Ensure sorted first
  const sorted = lyrics.sort((a, b) => a.startTimeMs - b.startTimeMs);
  const grouped: LyricEntity[] = [];
  
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.startTimeMs === current.startTimeMs) {
      // Same start time: merge text
      current.text += '\n' + next.text;
      
      // Update end time: use the max end time if available
      if (next.endTimeMs) {
        if (!current.endTimeMs || next.endTimeMs > current.endTimeMs) {
          current.endTimeMs = next.endTimeMs;
        }
      }
    } else {
      grouped.push(current);
      current = next;
    }
  }
  grouped.push(current);
  return grouped;
};

/**
 * Fixes malformed QRC XML where LyricContent attribute contains unescaped double quotes.
 * Ported from Java reference: fixInvalidQuotes
 */
export const fixInvalidQrcXml = (inputXml: string): string => {
  if (!inputXml) return inputXml;

  // Regex matches LyricContent="..."/> allowing for internal quotes via backtracking with [\s\S]*?
  // It captures the content inside the outer quotes.
  return inputXml.replace(/LyricContent="([\s\S]*?)"\s*\/>/g, (match, content) => {
    // Remove all double quotes from the content to make it a valid attribute value
    const cleaned = content.replace(/"/g, '');
    return `LyricContent="${cleaned}"/>`;
  });
};

/**
 * Parses a standard LRC file content
 * Format: [MM:SS.xx] or [MM:SS:xx]
 */
export const parseLrc = (content: string): LyricEntity[] => {
  const lines = content.split(/\r?\n/);
  const result: LyricEntity[] = [];
  
  // Regex: matches [00:00.00] or [00:00:00]
  // Group 1: MM, Group 2: SS, Group 3: separator, Group 4: xx (centiseconds or milliseconds)
  const timeRegex = /\[(\d+):(\d+)([.:])(\d+)\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let msStr = match[4];
      
      // If 2 digits, it's centiseconds (x10). If 3 digits, it's ms.
      let ms = parseInt(msStr, 10);
      if (msStr.length === 2) {
        ms *= 10;
      }

      const totalMs = (minutes * 60 * 1000) + (seconds * 1000) + ms;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        result.push({
          id: generateId(),
          startTimeMs: totalMs,
          text: text
        });
      }
    }
  }

  // Sort and group same-time lyrics
  return groupSameTimeLyrics(result);
};

/**
 * Parses a standard SRT file content
 * Format:
 * 1
 * 00:00:20,000 --> 00:00:24,400
 * Text content
 */
export const parseSrt = (content: string): LyricEntity[] => {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const result: LyricEntity[] = [];

  const timeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/;

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    // Line 1 is index (usually), Line 2 is time, Line 3+ is text
    // Sometimes index is missing or lines are shifted, so we look for the arrow
    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(timeRegex);

    if (match) {
      // Start Time
      const startMs = 
        (parseInt(match[1]) * 3600000) + 
        (parseInt(match[2]) * 60000) + 
        (parseInt(match[3]) * 1000) + 
        parseInt(match[4]);
      
      // End Time
      const endMs = 
        (parseInt(match[5]) * 3600000) + 
        (parseInt(match[6]) * 60000) + 
        (parseInt(match[7]) * 1000) + 
        parseInt(match[8]);

      // Extract text (everything after time line)
      const textLines = lines.slice(timeLineIndex + 1);
      const text = textLines.join('\n').trim();

      if (text) {
        result.push({
          id: generateId(),
          startTimeMs: startMs,
          endTimeMs: endMs,
          text: text
        });
      }
    }
  }
  
  // Sort and group same-time lyrics
  return groupSameTimeLyrics(result);
};

/**
 * Parses QRC XML Content (Post-Decryption)
 * Uses robust regex parsing to handle malformed XML often found in QRC files.
 */
export const parseQrcXml = (xmlContent: string): LyricEntity[] => {
  const result: LyricEntity[] = [];
  
  // 1. Apply compatibility fix for invalid quotes
  const cleanContent = fixInvalidQrcXml(xmlContent);

  try {
    // Treat content as a text stream containing [start,duration]text patterns.
    // This bypasses XML parsing issues like unescaped quotes inside the attribute.

    // Split by timestamp pattern: [digits,digits]
    // The capture group () includes the delimiters in the result array
    const parts = cleanContent.split(/(\[\d+,\d+\])/);
    
    // The split result will look like: ["XML_Header...", "[1000,2000]", "Lyric text ", "[3000,2000]", "Lyric text 2", ...]
    // Iterate from index 1 (skipping header)
    for (let i = 1; i < parts.length; i += 2) {
      const tag = parts[i];
      let text = parts[i+1] || ""; 
      
      const match = tag.match(/\[(\d+),(\d+)\]/);
      if (match) {
        const startMs = parseInt(match[1], 10);
        const durationMs = parseInt(match[2], 10);
        
        // Clean text:
        // 1. Remove char-level timing usually found in QRC (e.g., Word(100,20))
        text = text.replace(/\(\d+,\d+\)/g, '');

        // 2. Identify and remove XML structure (closing tags) if this is the last chunk
        // If the text contains "/>" or "</LyricInfo>", it marks the end of the lyric content.
        // We look for closing quotes or tags.
        const endMatch = text.match(/("|&quot;)?\s*(\/>|<\/LyricInfo>)/);
        if (endMatch && endMatch.index !== undefined) {
             text = text.substring(0, endMatch.index);
        }

        // 3. Decode common XML entities manually since we aren't using an XML parser
        text = text.replace(/&apos;/g, "'")
                   .replace(/&quot;/g, '"')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .trim();

        if (text) {
          result.push({
            id: generateId(),
            startTimeMs: startMs,
            endTimeMs: startMs + durationMs,
            text: text
          });
        }
      }
    }

    if (result.length === 0) {
        // Fallback: If no QRC timestamps [d,d] were found, try parsing as standard LRC.
        // This handles "QRC_TS" format (encrypted LRC) or generic LRC inside QRC.
        const lrcResult = parseLrc(cleanContent);
        if (lrcResult.length > 0) {
            return lrcResult;
        }
        
        console.warn("Parsed 0 lines from QRC. Content preview:", cleanContent.substring(0, 200));
    }

  } catch (e) {
    console.error("Failed to parse QRC content", e);
  }

  // Sort and group same-time lyrics
  return groupSameTimeLyrics(result);
}