import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Savings from '../models/Savings.js';
import Withdrawal from '../models/Withdrawal.js';
import { sanitizeForSpreadsheet } from '../utils/spreadsheetSanitizer.js';

const MAX_EXPORT_DOCS = 10000;
const truncate = (s, n = 300) => {
  const str = String(s ?? '');
  return str.length > n ? `${str.slice(0, n)}…` : str;
};

const parseReportDate = (v, label) => {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`Invalid ${label} date`);
    err.statusCode = 400;
    throw err;
  }
  return d;
};

const buildDateQuery = (startDate, endDate) => {
  const query = {};
  if (startDate || endDate) {
    query.date = {};
    const s = parseReportDate(startDate, 'start');
    const e = parseReportDate(endDate, 'end');
    if (s) query.date.$gte = s;
    if (e) query.date.$lte = e;
  }
  return query;
};

const fetchReportData = async (startDate, endDate) => {
  const dateQuery = buildDateQuery(startDate, endDate);

  const [savings, withdrawals] = await Promise.all([
    Savings.find(dateQuery).populate('user', 'name email').populate('goal', 'name').sort({ date: -1 }).limit(MAX_EXPORT_DOCS).lean(),
    Withdrawal.find(dateQuery).populate('user', 'name email').sort({ date: -1 }).limit(MAX_EXPORT_DOCS).lean(),
  ]);

  return { savings, withdrawals };
};

// @desc    Export savings + withdrawals report as CSV
// @route   GET /api/reports/csv
// @access  Private
export const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { savings, withdrawals } = await fetchReportData(startDate, endDate);

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = [
      ['Type', 'Date', 'User', 'Amount', 'Goal', 'Notes'].map(escapeCsv).join(','),
    ];

    savings.forEach((s) => {
      rows.push(
        [
          'Saving',
          new Date(s.date).toLocaleDateString(),
          sanitizeForSpreadsheet(s.user?.name || ''),
          s.amount,
          sanitizeForSpreadsheet(s.goal?.name || ''),
          sanitizeForSpreadsheet(s.notes || ''),
        ]
          .map(escapeCsv)
          .join(',')
      );
    });

    withdrawals.forEach((w) => {
      rows.push(
        [
          'Withdrawal',
          new Date(w.date).toLocaleDateString(),
          sanitizeForSpreadsheet(w.user?.name || ''),
          -w.amount,
          sanitizeForSpreadsheet(w.reason || ''),
          sanitizeForSpreadsheet(w.notes || ''),
        ]
          .map(escapeCsv)
          .join(',')
      );
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="savings-report.csv"');
    res.send(rows.join('\n'));
  } catch (error) {
    next(error);
  }
};

// @desc    Export savings + withdrawals report as Excel
// @route   GET /api/reports/excel
// @access  Private
export const exportExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { savings, withdrawals } = await fetchReportData(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Personal Savings Record System';
    workbook.created = new Date();

    const savingsSheet = workbook.addWorksheet('Savings');
    savingsSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Goal', key: 'goal', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 18 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    savingsSheet.getRow(1).font = { bold: true };

    savings.forEach((s) => {
      savingsSheet.addRow({
        date: new Date(s.date).toLocaleDateString(),
        user: sanitizeForSpreadsheet(s.user?.name || ''),
        amount: s.amount,
        type: s.type,
        goal: sanitizeForSpreadsheet(s.goal?.name || ''),
        paymentMethod: s.paymentMethod,
        notes: sanitizeForSpreadsheet(s.notes || ''),
      });
    });

    const withdrawalsSheet = workbook.addWorksheet('Withdrawals');
    withdrawalsSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Reason', key: 'reason', width: 25 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];
    withdrawalsSheet.getRow(1).font = { bold: true };

    withdrawals.forEach((w) => {
      withdrawalsSheet.addRow({
        date: new Date(w.date).toLocaleDateString(),
        user: sanitizeForSpreadsheet(w.user?.name || ''),
        amount: w.amount,
        reason: sanitizeForSpreadsheet(w.reason),
        notes: sanitizeForSpreadsheet(w.notes || ''),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="savings-report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export savings + withdrawals report as PDF
// @route   GET /api/reports/pdf
// @access  Private
export const exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { savings, withdrawals } = await fetchReportData(startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="savings-report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text('Personal Savings Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('gray').text(
      `Generated on ${new Date().toLocaleString()}${startDate || endDate ? ` — Range: ${startDate || 'start'} to ${endDate || 'now'}` : ''}`,
      { align: 'center' }
    );
    doc.moveDown(1.5);
    doc.fillColor('black');

    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    doc.fontSize(12).text(`Total Savings: ₹${totalSavings.toLocaleString()}`);
    doc.text(`Total Withdrawals: ₹${totalWithdrawals.toLocaleString()}`);
    doc.text(`Net Balance: ₹${(totalSavings - totalWithdrawals).toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(14).text('Savings', { underline: true });
    doc.moveDown(0.5);
    savings.forEach((s) => {
      doc
        .fontSize(9)
        .text(
          `${new Date(s.date).toLocaleDateString()}  |  ${truncate(s.user?.name || 'Unknown', 40)}  |  ₹${s.amount.toLocaleString()}  |  ${truncate(s.goal?.name || '-', 40)}  |  ${truncate(s.notes || '', 120)}`
        );
    });

    doc.moveDown(1);
    doc.fontSize(14).text('Withdrawals', { underline: true });
    doc.moveDown(0.5);
    withdrawals.forEach((w) => {
      doc
        .fontSize(9)
        .text(
          `${new Date(w.date).toLocaleDateString()}  |  ${truncate(w.user?.name || 'Unknown', 40)}  |  -₹${w.amount.toLocaleString()}  |  ${truncate(w.reason, 60)}  |  ${truncate(w.notes || '', 120)}`
        );
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
