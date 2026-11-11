// Local-date helpers — avoids the UTC shift caused by
// `new Date(yyyy-mm-dd).toISOString()` which moves IST midnight to prior day.

export const toLocalDateInput = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayLocalInput = () => toLocalDateInput(new Date());

export const formatINR = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
