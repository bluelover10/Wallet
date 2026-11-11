/**
 * Neutralizes CSV/Excel formula injection. If a user-controlled string
 * (e.g. notes, reason) starts with a character that spreadsheet software
 * interprets as the start of a formula (=, +, -, @, tab, CR, LF, VT, FF),
 * prefixing it with a single quote forces it to be treated as plain text
 * instead of being executed when the exported file is opened in Excel/Sheets.
 */
export const sanitizeForSpreadsheet = (value) => {
  const str = String(value ?? '');
  return /^[=+\-@\t\r\n\x0B\x0C]/.test(str) ? `'${str}` : str;
};
