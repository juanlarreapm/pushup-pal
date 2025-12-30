import { parse, isValid, setYear, setHours, setMinutes, setSeconds } from 'date-fns';

export interface ParsedEntry {
  date: Date;
  sets: number[];
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

function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g);
  if (!matches) return [];
  return matches.map(n => parseInt(n, 10)).filter(n => n > 0 && n <= 500);
}

export function parseHistoryText(text: string): ParseResult {
  const lines = text.split('\n').filter(line => line.trim());
  const entries: ParsedEntry[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Try to find a date at the beginning of the line
    // Common separators: : - | or just space before numbers
    const separatorMatch = trimmedLine.match(/^([^:\-|0-9]+(?:\/\d+)?(?:\/\d+)?)\s*[:\-|]?\s*(.*)$/);
    
    let dateStr = '';
    let numbersStr = '';

    if (separatorMatch) {
      dateStr = separatorMatch[1];
      numbersStr = separatorMatch[2];
    } else {
      // Try to extract date from beginning
      const dateMatch = trimmedLine.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[:\-|]?\s*(.*)$/);
      if (dateMatch) {
        dateStr = dateMatch[1];
        numbersStr = dateMatch[2];
      }
    }

    if (!dateStr) {
      // Maybe the whole line is just numbers for a date already set
      const numbers = extractNumbers(trimmedLine);
      if (numbers.length === 0) {
        warnings.push(`Could not parse line: "${trimmedLine}"`);
      }
      continue;
    }

    const date = parseDate(dateStr);
    if (!date) {
      warnings.push(`Could not parse date: "${dateStr}" from line: "${trimmedLine}"`);
      continue;
    }

    const sets = extractNumbers(numbersStr);
    if (sets.length === 0) {
      warnings.push(`No rep counts found in line: "${trimmedLine}"`);
      continue;
    }

    entries.push({
      date,
      sets,
      total: sets.reduce((a, b) => a + b, 0),
      rawLine: trimmedLine,
    });
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
