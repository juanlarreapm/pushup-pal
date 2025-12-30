import { parse, isValid, setYear, setHours, setMinutes, setSeconds } from 'date-fns';

export interface ParsedSet {
  reps: number;
  variation: string | null; // null = Standard
}

export interface ParsedEntry {
  date: Date;
  sets: ParsedSet[];
  total: number;
  rawLine: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  warnings: string[];
  totalSets: number;
  totalReps: number;
  dateRange: { start: Date | null; end: Date | null };
}

const currentYear = new Date().getFullYear();

function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  
  // Common date patterns to try
  const patterns = [
    { format: 'M/d/yy', hasYear: true },
    { format: 'M/d/yyyy', hasYear: true },
    { format: 'M/d', hasYear: false },
    { format: 'MM/dd', hasYear: false },
    { format: 'MMM d', hasYear: false },
    { format: 'MMMM d', hasYear: false },
  ];

  for (const { format: fmt, hasYear } of patterns) {
    try {
      let date = parse(trimmed, fmt, new Date());
      if (isValid(date)) {
        // If no year in format, assume current year or previous year based on context
        if (!hasYear) {
          date = setYear(date, currentYear);
          // If date is in the future, assume last year
          if (date > new Date()) {
            date = setYear(date, currentYear - 1);
          }
        }
        // Set time to noon to avoid timezone issues
        date = setHours(setMinutes(setSeconds(date, 0), 0), 12);
        return date;
      }
    } catch {
      // Continue to next pattern
    }
  }

  return null;
}

// Map suffixes to variation names
const VARIATION_MAP: Record<string, string> = {
  'w': 'Weighted',
  'd': 'Decline',
  'i': 'Incline',
  'x': 'Wide',
  'm': 'Diamond',
};

function extractSetsWithVariations(str: string): ParsedSet[] {
  // Match numbers optionally followed by a variation suffix (w, d, i, x, m)
  const matches = str.match(/(\d+)([wdixm])?/gi);
  if (!matches) return [];
  
  return matches
    .map(match => {
      const numMatch = match.match(/^(\d+)([wdixm])?$/i);
      if (!numMatch) return null;
      
      const reps = parseInt(numMatch[1], 10);
      if (reps <= 0 || reps > 500) return null;
      
      const suffix = numMatch[2]?.toLowerCase();
      const variation = suffix ? VARIATION_MAP[suffix] || null : null;
      
      return { reps, variation };
    })
    .filter((set): set is ParsedSet => set !== null);
}

export function parseHistoryText(text: string): ParseResult {
  const lines = text.split('\n');
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];
  
  let currentDate: Date | null = null;
  let currentDateStr = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if line is ONLY a date (no numbers)
    const dateOnlyMatch = trimmedLine.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)$/);
    if (dateOnlyMatch) {
      const date = parseDate(dateOnlyMatch[1]);
      if (date) {
        currentDate = date;
        currentDateStr = dateOnlyMatch[1];
      } else {
        warnings.push(`Could not parse date: "${dateOnlyMatch[1]}"`);
      }
      continue;
    }

    // Check if line is ONLY numbers (use current date)
    const sets = extractSetsWithVariations(trimmedLine);
    const hasNoDatePattern = !trimmedLine.match(/\d{1,2}\/\d{1,2}/);
    
    if (hasNoDatePattern && sets.length > 0) {
      if (currentDate) {
        entries.push({
          date: currentDate,
          sets,
          total: sets.reduce((a, b) => a + b.reps, 0),
          rawLine: `${currentDateStr}: ${trimmedLine}`,
        });
      } else {
        warnings.push(`No date found for sets: "${trimmedLine}"`);
      }
      continue;
    }

    // Try single-line format: date and numbers on same line
    const dateMatch = trimmedLine.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[:\-|]?\s*(.*)$/);
    if (dateMatch) {
      const date = parseDate(dateMatch[1]);
      if (!date) {
        warnings.push(`Could not parse date: "${dateMatch[1]}" from line: "${trimmedLine}"`);
        continue;
      }

      const lineSets = extractSetsWithVariations(dateMatch[2]);
      if (lineSets.length === 0) {
        // This might be a date-only line with separator
        currentDate = date;
        currentDateStr = dateMatch[1];
        continue;
      }

      entries.push({
        date,
        sets: lineSets,
        total: lineSets.reduce((a, b) => a + b.reps, 0),
        rawLine: trimmedLine,
      });
      continue;
    }

    // Couldn't parse the line
    if (sets.length === 0) {
      warnings.push(`Could not parse line: "${trimmedLine}"`);
    }
  }

  // Sort by date
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate totals
  const totalSets = entries.reduce((sum, e) => sum + e.sets.length, 0);
  const totalReps = entries.reduce((sum, e) => sum + e.total, 0);

  // Date range
  const dateRange = {
    start: entries.length > 0 ? entries[0].date : null,
    end: entries.length > 0 ? entries[entries.length - 1].date : null,
  };

  return { entries, warnings, totalSets, totalReps, dateRange };
}
